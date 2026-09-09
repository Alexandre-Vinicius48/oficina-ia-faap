import { NextResponse } from "next/server";
import { z } from "zod";
import { administradorAtual } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { dentroDoLimite } from "@/lib/limite-requisicoes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * EXCLUSAO DE UMA AVALIACAO.
 *
 * Serve principalmente para limpar testes feitos antes do encontro, e para
 * remover uma resposta ofensiva se aparecer alguma.
 *
 * Apagar a avaliacao NAO libera a pessoa para avaliar de novo enquanto a aula
 * estiver aberta — na verdade libera, porque o indice unico deixa de existir
 * para aquele par. E o comportamento desejado: se o responsavel apagou por
 * engano, a pessoa consegue responder outra vez.
 */

const corpoSchema = z.object({ id: z.string().uuid() });

function json(dados: unknown, status: number) {
  return NextResponse.json(dados, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

export async function POST(request: Request) {
  const admin = await administradorAtual();
  if (!admin) return json({ erro: "Acesso restrito." }, 403);

  const limite = dentroDoLimite(`admin-excluir-aval:${admin.userId}`, 60, 60 * 1000);
  if (!limite.permitido) {
    return json({ erro: "Muitas exclusões seguidas. Aguarde um minuto." }, 429);
  }

  let bruto: unknown;
  try {
    bruto = await request.json();
  } catch {
    return json({ erro: "Pedido inválido." }, 400);
  }

  const analise = corpoSchema.safeParse(bruto);
  if (!analise.success) return json({ erro: "Pedido inválido." }, 400);

  const supabase = supabaseAdmin();
  const { data, error } = await supabase
    .from("avaliacoes")
    .delete()
    .eq("id", analise.data.id)
    .select("id");

  if (error) {
    console.error("[admin] falha ao excluir avaliacao", {
      codigo: error.code ?? "desconhecido",
    });
    return json({ erro: "Não foi possível excluir a resposta. Tente novamente." }, 500);
  }

  if (!data || data.length === 0) {
    return json({ erro: "Esta resposta já foi excluída." }, 404);
  }

  // Auditoria sem conteudo da resposta e sem quem a escreveu.
  console.info("[admin] avaliacao excluida", {
    administrador: admin.userId,
    avaliacao: analise.data.id,
  });

  return json({ ok: true }, 200);
}

export async function GET() {
  return json({ erro: "Método não permitido." }, 405);
}
