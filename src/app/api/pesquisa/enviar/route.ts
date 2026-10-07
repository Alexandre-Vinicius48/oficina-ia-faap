import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { pesquisaSchema } from "@/lib/validacao";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { lerSessao, NOME_COOKIE } from "@/lib/sessao-pesquisa";
import { dentroDoLimite } from "@/lib/limite-requisicoes";
import { PERGUNTAS_ABERTAS } from "@/lib/pesquisa";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * ENVIO DO QUESTIONARIO FINAL.
 *
 * So aceita de quem tem o cookie assinado da rota de entrada, e so enquanto
 * a pesquisa continuar aberta. Se o responsavel encerrar, ninguem mais
 * envia — nem quem ja estava com a tela aberta.
 */

function json(dados: unknown, status: number) {
  return NextResponse.json(dados, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

/** Texto em branco vira null no banco, para nao guardar string vazia. */
function ouNulo(texto: string | undefined): string | null {
  const limpo = (texto ?? "").trim();
  return limpo === "" ? null : limpo;
}

export async function POST(request: Request) {
  const armazem = await cookies();
  const sessao = await lerSessao(armazem.get(NOME_COOKIE)?.value);

  if (!sessao) {
    return json(
      { erro: "Sua sessão expirou. Digite seu celular e o código de novo." },
      401,
    );
  }

  // Limite por PESSOA, e nao por rede: a turma inteira envia pelo mesmo
  // Wi-Fi ao mesmo tempo. Cada pessoa so responde uma vez de qualquer
  // forma; este numero cobre reenvios por conexao instavel.
  const limite = dentroDoLimite(
    `pesquisa-enviar:${sessao.inscricaoId}`,
    10,
    10 * 60 * 1000,
  );
  if (!limite.permitido) {
    return json({ erro: "Muitas tentativas. Aguarde alguns minutos." }, 429);
  }

  let bruto: unknown;
  try {
    bruto = await request.json();
  } catch {
    return json({ erro: "Não conseguimos ler suas respostas. Tente novamente." }, 400);
  }

  const analise = pesquisaSchema.safeParse(bruto);
  if (!analise.success) {
    const problema = analise.error.issues[0];
    // O caminho vem como ["respostas", "org_bem_organizada"]: devolvemos a
    // chave da pergunta para a tela levar a pessoa ate ela.
    const caminho = problema?.path ?? [];
    const campo = caminho[caminho.length - 1];
    return json(
      {
        erro: problema?.message ?? "Confira suas respostas.",
        campo: typeof campo === "string" ? campo : null,
      },
      400,
    );
  }

  const supabase = supabaseAdmin();

  // A pesquisa precisa continuar aberta AGORA.
  const { data: config } = await supabase
    .from("configuracoes")
    .select("pesquisa_aberta")
    .maybeSingle();

  if (!config || config.pesquisa_aberta !== true) {
    return json(
      { erro: "O questionário foi encerrado. Obrigado mesmo assim!" },
      409,
    );
  }

  const dados = analise.data as Record<string, unknown> & {
    respostas: Record<string, number>;
  };

  const abertas = Object.fromEntries(
    PERGUNTAS_ABERTAS.map((p) => [p.coluna, ouNulo(dados[p.coluna] as string)]),
  );

  const { error } = await supabase.from("pesquisa_respostas").insert({
    inscricao_id: sessao.inscricaoId,
    respostas: dados.respostas,
    ...abertas,
  });

  if (error) {
    // 23505 = indice unico: uma resposta por pessoa.
    if (error.code === "23505") {
      return json(
        { erro: "Você já respondeu ao questionário. Obrigado pela participação!" },
        409,
      );
    }
    console.error("[pesquisa] falha ao gravar", {
      codigo: error.code ?? "desconhecido",
    });
    return json(
      { erro: "Não conseguimos guardar suas respostas. Tente novamente." },
      500,
    );
  }

  // Log sem nenhuma resposta e sem quem enviou.
  console.info("[pesquisa] resposta registrada");

  return json({ ok: true }, 201);
}

export async function GET() {
  return json({ erro: "Método não permitido." }, 405);
}
