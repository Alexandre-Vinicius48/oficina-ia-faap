import { NextResponse } from "next/server";
import { z } from "zod";
import { inscricaoSchema } from "@/lib/validacao";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { dentroDoLimite, impressaoDigital } from "@/lib/limite-requisicoes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * ROTA PUBLICA DE MATRICULA - a "operacao controlada" citada na seguranca.
 *
 * Esta e a UNICA maneira de gravar uma inscricao. Ela:
 *   1. limita a quantidade de envios do mesmo aparelho (anti-robo);
 *   2. rejeita envios de robo (campo-armadilha e envio rapido demais);
 *   3. valida tudo de novo no servidor - nunca confiamos no navegador;
 *   4. grava usando a chave secreta, que so existe no servidor;
 *   5. devolve apenas "deu certo" ou "deu errado", nunca os dados gravados.
 *
 * Nao existe rota publica de LEITURA de inscricoes em lugar nenhum do projeto.
 */

// Quantos envios um mesmo aparelho pode fazer em 10 minutos.
// Valor generoso de proposito: em um centro comunitario varias pessoas se
// inscrevem pela mesma rede Wi-Fi e nao podem ser bloqueadas.
const MAXIMO_ENVIOS = 20;
const JANELA_MS = 10 * 60 * 1000;

// Tempo minimo entre abrir o formulario e enviar. Gente digitando leva muito
// mais do que isso; robo envia na hora.
const TEMPO_MINIMO_MS = 1500;

const corpoSchema = inscricaoSchema.extend({
  _armadilha: z.string().max(200).optional(),
  _tempo: z.number().nonnegative().optional(),
});

function respostaJson(dados: unknown, status: number) {
  return NextResponse.json(dados, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

export async function POST(request: Request) {
  // ---- 1. Limite de envios ------------------------------------------------
  const digital = await impressaoDigital(request.headers);
  const limite = dentroDoLimite(`inscricao:${digital}`, MAXIMO_ENVIOS, JANELA_MS);

  if (!limite.permitido) {
    return respostaJson(
      {
        erro:
          "Recebemos muitas tentativas deste aparelho. Aguarde alguns minutos e tente novamente.",
      },
      429,
    );
  }

  // ---- 2. Leitura do corpo ------------------------------------------------
  let bruto: unknown;
  try {
    bruto = await request.json();
  } catch {
    return respostaJson(
      { erro: "Não conseguimos concluir sua matrícula. Tente novamente." },
      400,
    );
  }

  const analise = corpoSchema.safeParse(bruto);

  if (!analise.success) {
    const problema = analise.error.issues[0];
    return respostaJson(
      {
        erro: problema?.message ?? "Confira os dados digitados.",
        campo: problema?.path?.[0] ?? null,
      },
      400,
    );
  }

  const dados = analise.data;

  // ---- 3. Barreiras anti-robô --------------------------------------------
  // Respondemos "sucesso" para o robô não descobrir que foi barrado,
  // mas nada é gravado.
  const pareceRobo =
    (dados._armadilha ?? "") !== "" ||
    (dados._tempo !== undefined && dados._tempo < TEMPO_MINIMO_MS);

  if (pareceRobo) {
    console.warn("[inscricoes] envio automatizado descartado");
    return respostaJson({ ok: true }, 201);
  }

  // ---- 4. Gravação --------------------------------------------------------
  const supabase = supabaseAdmin();

  const { error } = await supabase.from("inscricoes").insert({
    nome_completo: dados.nome_completo,
    cpf: dados.cpf, // somente números
    rg: dados.rg,
    celular: dados.celular, // somente números
    email: dados.email,
    consentimento_lgpd: true,
    data_inscricao: new Date().toISOString(),
  });

  if (error) {
    // 23505 = violação de índice único. O único índice único é o do CPF.
    if (error.code === "23505") {
      return respostaJson(
        { erro: "Este CPF já possui uma inscrição.", campo: "cpf" },
        409,
      );
    }

    // Log sem NENHUM dado pessoal: só o código técnico do erro.
    console.error("[inscricoes] falha ao gravar", {
      codigo: error.code ?? "desconhecido",
    });

    return respostaJson(
      { erro: "Não conseguimos concluir sua matrícula. Tente novamente." },
      500,
    );
  }

  // ---- 5. Sucesso ---------------------------------------------------------
  const resposta = respostaJson({ ok: true }, 201);

  // Marca apenas que a matrícula acabou de acontecer, para a tela de sucesso.
  // Não guarda nome, CPF nem qualquer outro dado.
  resposta.cookies.set("matricula_ok", "1", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 600,
  });

  return resposta;
}

/** Qualquer outro método é recusado explicitamente. */
export async function GET() {
  return respostaJson({ erro: "Método não permitido." }, 405);
}
