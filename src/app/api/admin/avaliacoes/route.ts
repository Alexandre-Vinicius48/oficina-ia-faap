import { NextResponse } from "next/server";
import { z } from "zod";
import { administradorAtual } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { dentroDoLimite } from "@/lib/limite-requisicoes";
import { ROSTOS } from "@/lib/escala";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * AVALIACOES DE UMA AULA, PARA O PAINEL.
 *
 * Devolve nota, comentario e horario — e DE PROPOSITO nao devolve quem
 * escreveu. O vinculo com a inscricao existe no banco apenas para impedir
 * que a mesma pessoa avalie duas vezes.
 *
 * A razao e pratica: gente escreve o que realmente pensa quando sabe que a
 * critica nao vem com o nome colado. Um participante que achou a aula
 * confusa dificilmente diria isso se soubesse que o organizador veria seu
 * nome ao lado.
 */

const corpoSchema = z.object({ aulaId: z.string().uuid() });

function json(dados: unknown, status: number) {
  return NextResponse.json(dados, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

export async function POST(request: Request) {
  const admin = await administradorAtual();
  if (!admin) return json({ erro: "Acesso restrito." }, 403);

  const limite = dentroDoLimite(`admin-avaliacoes:${admin.userId}`, 120, 60 * 1000);
  if (!limite.permitido) {
    return json({ erro: "Muitas consultas seguidas. Aguarde." }, 429);
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
  const { data, error } = await supabase
    .from("avaliacoes")
    .select("id, nota, comentario, created_at")
    .eq("aula_id", analise.data.aulaId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[admin] falha ao listar avaliacoes", {
      codigo: error.code ?? "desconhecido",
    });
    return json({ erro: "Não foi possível carregar as avaliações." }, 500);
  }

  const itens = data ?? [];
  // Derivada da escala, e nao fixa: se o numero de rostos mudar, o grafico
  // do painel acompanha sozinho.
  const distribuicao = ROSTOS.map(
    (rosto) => itens.filter((i) => i.nota === rosto.nota).length,
  );

  return json({ itens, distribuicao }, 200);
}

export async function GET() {
  return json({ erro: "Método não permitido." }, 405);
}
