import { NextResponse } from "next/server";
import { entradaAvaliacaoSchema } from "@/lib/validacao";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { criarSessao, NOME_COOKIE } from "@/lib/sessao-avaliacao";
import {
  dentroDoLimite,
  impressaoDigital,
  registrarFalha,
} from "@/lib/limite-requisicoes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * ENTRADA NA AREA DO PARTICIPANTE.
 *
 * Tres conferencias precisam passar juntas:
 *   1. existe uma aula com a avaliacao ABERTA agora;
 *   2. o codigo digitado e o codigo daquela aula (prova que a pessoa estava
 *      na sala, porque o codigo so aparece na tela do encontro e muda toda
 *      vez que a avaliacao e aberta);
 *   3. o celular esta entre os inscritos.
 *
 * So entao gravamos um cookie assinado dizendo quem e a pessoa e qual aula
 * ela pode avaliar. O cookie vale 3 horas.
 */

function json(dados: unknown, status: number) {
  return NextResponse.json(dados, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

/** Quantos ERROS o mesmo aparelho pode cometer antes de ser barrado. */
const MAXIMO_DE_ERROS = 10;
const JANELA_MS = 10 * 60 * 1000;

export async function POST(request: Request) {
  // Trava contra quem fica testando telefones para descobrir quem esta
  // inscrito. Conta apenas os ERROS: numa sala de aula a turma inteira sai
  // pelo mesmo Wi-Fi, e contar os acertos bloquearia os proprios alunos.
  const digital = await impressaoDigital(request.headers);
  const chaveLimite = `avaliacao-entrar:${digital}`;
  const falhar = () => registrarFalha(chaveLimite, MAXIMO_DE_ERROS, JANELA_MS);

  const limite = dentroDoLimite(chaveLimite, MAXIMO_DE_ERROS, JANELA_MS, {
    contar: false,
  });
  if (!limite.permitido) {
    return json(
      { erro: "Muitas tentativas erradas. Aguarde alguns minutos e tente de novo." },
      429,
    );
  }

  let bruto: unknown;
  try {
    bruto = await request.json();
  } catch {
    return json({ erro: "Não conseguimos ler seus dados. Tente novamente." }, 400);
  }

  const analise = entradaAvaliacaoSchema.safeParse(bruto);
  if (!analise.success) {
    falhar();
    const problema = analise.error.issues[0];
    return json(
      {
        erro: problema?.message ?? "Confira o que você digitou.",
        campo: problema?.path?.[0] ?? null,
      },
      400,
    );
  }

  const { celular, codigo } = analise.data;
  const supabase = supabaseAdmin();

  // ---- 1 e 2: a aula aberta, com o codigo certo -----------------------------
  const { data: aula, error: erroAula } = await supabase
    .from("aulas")
    .select("id, numero, tema, data, codigo_presenca")
    .eq("avaliacao_aberta", true)
    .maybeSingle();

  if (erroAula) {
    console.error("[avaliacao] falha ao buscar aula", {
      codigo: erroAula.code ?? "desconhecido",
    });
    return json({ erro: "Não conseguimos abrir a avaliação. Tente novamente." }, 500);
  }

  if (!aula) {
    return json(
      {
        erro: "A avaliação ainda não foi liberada. Aguarde o aviso na sala.",
        campo: "codigo",
      },
      409,
    );
  }

  if (aula.codigo_presenca !== codigo) {
    falhar();
    return json(
      { erro: "Código incorreto. Confira o número que está na tela da sala.", campo: "codigo" },
      403,
    );
  }

  // ---- 3: o celular precisa estar entre os inscritos ------------------------
  const { data: inscricao, error: erroInscricao } = await supabase
    .from("inscricoes")
    .select("id, nome_completo")
    .eq("celular", celular)
    .maybeSingle();

  if (erroInscricao) {
    console.error("[avaliacao] falha ao buscar inscricao", {
      codigo: erroInscricao.code ?? "desconhecido",
    });
    return json({ erro: "Não conseguimos abrir a avaliação. Tente novamente." }, 500);
  }

  if (!inscricao) {
    falhar();
    return json(
      {
        erro: "Não encontramos este celular na lista de inscritos. Confira o número ou fale com a organização.",
        campo: "celular",
      },
      404,
    );
  }

  // Ja avaliou esta aula?
  const { data: existente } = await supabase
    .from("avaliacoes")
    .select("id")
    .eq("aula_id", aula.id)
    .eq("inscricao_id", inscricao.id)
    .maybeSingle();

  const { valor, duracaoSegundos } = await criarSessao(
    inscricao.id as string,
    aula.id as string,
  );

  // Log sem dado pessoal: so o numero da aula.
  console.info("[avaliacao] entrada liberada", { aula: aula.numero });

  const resposta = json(
    {
      // Apenas o primeiro nome: confirma para a pessoa que ela chegou no
      // lugar certo, sem exibir o nome completo na tela.
      primeiroNome: String(inscricao.nome_completo).split(" ")[0] ?? "",
      aula: { numero: aula.numero, tema: aula.tema, data: aula.data },
      jaAvaliou: Boolean(existente),
    },
    200,
  );

  resposta.cookies.set(NOME_COOKIE, valor, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: duracaoSegundos,
  });

  return resposta;
}

export async function GET() {
  return json({ erro: "Método não permitido." }, 405);
}
