import { NextResponse } from "next/server";
import { z } from "zod";
import { administradorAtual } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { dentroDoLimite } from "@/lib/limite-requisicoes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * ABRIR E FECHAR AS INSCRICOES.
 *
 * O estado vive no banco, entao a mudanca vale na hora para todo mundo, sem
 * precisar publicar o site de novo.
 */

const corpoSchema = z.object({
  acao: z.enum(["ler", "abrir", "fechar"]),
});

function json(dados: unknown, status: number) {
  return NextResponse.json(dados, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

export async function POST(request: Request) {
  const admin = await administradorAtual();
  if (!admin) return json({ erro: "Acesso restrito." }, 403);

  const limite = dentroDoLimite(`admin-config:${admin.userId}`, 60, 60 * 1000);
  if (!limite.permitido) {
    return json({ erro: "Muitas ações seguidas. Aguarde alguns segundos." }, 429);
  }

  let bruto: unknown = {};
  try {
    bruto = await request.json();
  } catch {
    bruto = {};
  }

  const analise = corpoSchema.safeParse(bruto);
  if (!analise.success) return json({ erro: "Pedido inválido." }, 400);

  const supabase = supabaseAdmin();

  try {
    if (analise.data.acao !== "ler") {
      const abrir = analise.data.acao === "abrir";

      // upsert: cobre tambem o caso de a linha de configuracao nao existir.
      const { error } = await supabase
        .from("configuracoes")
        .upsert({ id: true, inscricoes_abertas: abrir }, { onConflict: "id" });

      if (error) throw error;

      console.info("[admin] inscricoes", {
        administrador: admin.userId,
        estado: abrir ? "abertas" : "fechadas",
      });
    }

    const { data, error } = await supabase
      .from("configuracoes")
      .select("inscricoes_abertas, atualizado_em")
      .maybeSingle();

    if (error) throw error;

    return json(
      {
        inscricoesAbertas: data?.inscricoes_abertas ?? true,
        atualizadoEm: data?.atualizado_em ?? null,
      },
      200,
    );
  } catch (erro) {
    console.error("[admin] falha nas configuracoes", {
      codigo: (erro as { code?: string })?.code ?? "desconhecido",
    });
    return json({ erro: "Não foi possível concluir a ação. Tente novamente." }, 500);
  }
}

export async function GET() {
  return json({ erro: "Método não permitido." }, 405);
}
