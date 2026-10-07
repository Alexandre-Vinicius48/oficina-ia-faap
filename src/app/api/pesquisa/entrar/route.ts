import { NextResponse } from "next/server";
import { entradaPesquisaSchema } from "@/lib/validacao";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { criarSessao, NOME_COOKIE } from "@/lib/sessao-pesquisa";
import {
  dentroDoLimite,
  impressaoDigital,
  registrarFalha,
} from "@/lib/limite-requisicoes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * ENTRADA NO QUESTIONARIO FINAL.
 *
 * Mesmas tres conferencias da avaliacao de aula:
 *   1. a pesquisa esta ABERTA agora;
 *   2. o codigo digitado e o codigo da vez (prova que a pessoa estava na
 *      sala: ele so aparece na tela do encontro e muda a cada abertura);
 *   3. o celular esta entre os inscritos.
 *
 * So entao gravamos o cookie assinado. Ele NAO guarda aula nenhuma: a
 * pesquisa e sobre a oficina inteira.
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
  // Conta apenas os ERROS: numa sala de aula a turma inteira sai pelo mesmo
  // Wi-Fi, e contar os acertos bloquearia os proprios alunos.
  const digital = await impressaoDigital(request.headers);
  const chaveLimite = `pesquisa-entrar:${digital}`;
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

  const analise = entradaPesquisaSchema.safeParse(bruto);
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

  // ---- 1 e 2: a pesquisa aberta, com o codigo certo ------------------------
  const { data: config, error: erroConfig } = await supabase
    .from("configuracoes")
    .select("pesquisa_aberta, pesquisa_codigo")
    .maybeSingle();

  if (erroConfig) {
    console.error("[pesquisa] falha ao consultar o estado", {
      codigo: erroConfig.code ?? "desconhecido",
    });
    return json({ erro: "Não conseguimos abrir o questionário. Tente novamente." }, 500);
  }

  if (!config || config.pesquisa_aberta !== true) {
    return json(
      {
        erro: "O questionário ainda não foi liberado. Aguarde o aviso na sala.",
        campo: "codigo",
      },
      409,
    );
  }

  if (config.pesquisa_codigo !== codigo) {
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
    console.error("[pesquisa] falha ao buscar inscricao", {
      codigo: erroInscricao.code ?? "desconhecido",
    });
    return json({ erro: "Não conseguimos abrir o questionário. Tente novamente." }, 500);
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

  const { data: existente } = await supabase
    .from("pesquisa_respostas")
    .select("id")
    .eq("inscricao_id", inscricao.id)
    .maybeSingle();

  const { valor, duracaoSegundos } = await criarSessao(inscricao.id as string);

  // Log sem dado pessoal nenhum.
  console.info("[pesquisa] entrada liberada");

  const resposta = json(
    {
      // Apenas o primeiro nome: confirma para a pessoa que ela chegou no
      // lugar certo, sem exibir o nome completo na tela.
      primeiroNome: String(inscricao.nome_completo).split(" ")[0] ?? "",
      jaRespondeu: Boolean(existente),
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
