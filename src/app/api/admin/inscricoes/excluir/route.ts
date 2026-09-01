import { NextResponse } from "next/server";
import { z } from "zod";
import { administradorAtual } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { dentroDoLimite } from "@/lib/limite-requisicoes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * EXCLUSAO DE UMA INSCRICAO.
 *
 * Atende tambem ao direito do titular previsto na LGPD: a pessoa pode pedir
 * que sua inscricao seja apagada, e o responsavel faz isso pelo painel.
 *
 * Usa POST com o identificador no corpo (e nao DELETE com ele na URL) para
 * manter o mesmo padrao do restante da area administrativa: nada de dado
 * de inscrito viajando em endereco da web ou em log de servidor.
 *
 * A exclusao e definitiva: o registro sai do banco de verdade.
 */

const corpoSchema = z.object({
  id: z.string().uuid({ message: "Identificador inválido." }),
});

function respostaJson(dados: unknown, status: number) {
  return NextResponse.json(dados, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

export async function POST(request: Request) {
  const admin = await administradorAtual();

  if (!admin) {
    return respostaJson({ erro: "Acesso restrito." }, 403);
  }

  // Trava contra exclusao em massa acidental ou automatizada.
  const limite = dentroDoLimite(`admin-excluir:${admin.userId}`, 30, 60 * 1000);
  if (!limite.permitido) {
    return respostaJson(
      { erro: "Muitas exclusões seguidas. Aguarde um minuto." },
      429,
    );
  }

  let corpo: unknown;
  try {
    corpo = await request.json();
  } catch {
    return respostaJson({ erro: "Pedido inválido." }, 400);
  }

  const analise = corpoSchema.safeParse(corpo);
  if (!analise.success) {
    return respostaJson({ erro: "Pedido inválido." }, 400);
  }

  const supabase = supabaseAdmin();

  // "select" depois do delete devolve o que foi apagado — usamos so para
  // saber se existia mesmo, sem expor nada de volta para a tela.
  const { data, error } = await supabase
    .from("inscricoes")
    .delete()
    .eq("id", analise.data.id)
    .select("id");

  if (error) {
    console.error("[admin] falha ao excluir inscricao", {
      codigo: error.code ?? "desconhecido",
    });
    return respostaJson(
      { erro: "Não foi possível excluir a inscrição. Tente novamente." },
      500,
    );
  }

  if (!data || data.length === 0) {
    return respostaJson({ erro: "Esta inscrição já foi excluída." }, 404);
  }

  // Registro de auditoria: quem apagou e qual registro. Nenhum dado pessoal.
  console.info("[admin] inscricao excluida", {
    administrador: admin.userId,
    inscricao: analise.data.id,
  });

  return respostaJson({ ok: true }, 200);
}

export async function GET() {
  return respostaJson({ erro: "Método não permitido." }, 405);
}
