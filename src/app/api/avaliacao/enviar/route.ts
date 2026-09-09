import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { avaliacaoSchema } from "@/lib/validacao";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { lerSessao, NOME_COOKIE } from "@/lib/sessao-avaliacao";
import { dentroDoLimite } from "@/lib/limite-requisicoes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * ENVIO DA AVALIACAO.
 *
 * So aceita de quem tem o cookie assinado da rota de entrada, e so enquanto
 * a aula continuar aberta. Se o responsavel fechar a avaliacao, ninguem mais
 * envia — nem quem ja estava com a tela aberta.
 */

function json(dados: unknown, status: number) {
  return NextResponse.json(dados, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
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
  // Wi-Fi ao mesmo tempo, e um limite por rede barraria os proprios alunos.
  // Cada pessoa so consegue avaliar uma vez de qualquer forma; este numero
  // cobre reenvios por conexao instavel.
  const limite = dentroDoLimite(
    `avaliacao-enviar:${sessao.inscricaoId}`,
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
    return json({ erro: "Não conseguimos ler sua resposta. Tente novamente." }, 400);
  }

  const analise = avaliacaoSchema.safeParse(bruto);
  if (!analise.success) {
    const problema = analise.error.issues[0];
    return json(
      {
        erro: problema?.message ?? "Confira sua resposta.",
        campo: problema?.path?.[0] ?? null,
      },
      400,
    );
  }

  const supabase = supabaseAdmin();

  // A aula precisa continuar aberta AGORA, e ser a mesma da sessao.
  const { data: aula } = await supabase
    .from("aulas")
    .select("id, numero, avaliacao_aberta")
    .eq("id", sessao.aulaId)
    .maybeSingle();

  if (!aula || aula.avaliacao_aberta !== true) {
    return json(
      { erro: "A avaliação desta aula foi encerrada. Obrigado mesmo assim!" },
      409,
    );
  }

  const { nota, comentario } = analise.data;

  const { error } = await supabase.from("avaliacoes").insert({
    aula_id: sessao.aulaId,
    inscricao_id: sessao.inscricaoId,
    nota,
    comentario: comentario === "" ? null : comentario,
  });

  if (error) {
    // 23505 = indice unico: uma avaliacao por pessoa por aula.
    if (error.code === "23505") {
      return json(
        { erro: "Você já avaliou esta aula. Obrigado pela participação!" },
        409,
      );
    }
    console.error("[avaliacao] falha ao gravar", {
      codigo: error.code ?? "desconhecido",
    });
    return json(
      { erro: "Não conseguimos guardar sua avaliação. Tente novamente." },
      500,
    );
  }

  // Log sem nota, sem comentario e sem quem enviou.
  console.info("[avaliacao] avaliacao registrada", { aula: aula.numero });

  return json({ ok: true }, 201);
}

export async function GET() {
  return json({ erro: "Método não permitido." }, 405);
}
