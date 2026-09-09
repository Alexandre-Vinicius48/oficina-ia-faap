import { NextResponse } from "next/server";
import QRCode from "qrcode";
import { z } from "zod";
import { administradorAtual } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { dentroDoLimite } from "@/lib/limite-requisicoes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * AULAS E AVALIACOES, PARA O PAINEL ADMINISTRATIVO.
 *
 * Uma rota so, com tres acoes:
 *   listar  -> as aulas, com quantas avaliacoes cada uma tem e a media
 *   abrir   -> sorteia um codigo novo e libera a avaliacao daquela aula
 *   fechar  -> encerra a avaliacao
 *
 * Ao abrir, devolvemos tambem o QR Code ja desenhado, para o responsavel
 * projetar na sala. O endereco dentro do QR ja leva o codigo, entao o
 * participante so precisa digitar o proprio celular.
 */

const corpoSchema = z.object({
  acao: z.enum(["listar", "abrir", "fechar"]),
  aulaId: z.string().uuid().optional(),
});

function json(dados: unknown, status: number) {
  return NextResponse.json(dados, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

/** Quatro digitos sorteados de forma criptograficamente segura. */
function sortearCodigo(): string {
  const numeros = new Uint32Array(1);
  crypto.getRandomValues(numeros);
  return String((numeros[0] ?? 0) % 10000).padStart(4, "0");
}

function enderecoBase(request: Request): string {
  const cabecalhos = request.headers;
  const host = cabecalhos.get("x-forwarded-host") ?? cabecalhos.get("host") ?? "";
  const protocolo = cabecalhos.get("x-forwarded-proto") ?? "https";
  return host ? `${protocolo}://${host}` : "";
}

type Aula = {
  id: string;
  numero: number;
  tema: string;
  data: string;
  avaliacao_aberta: boolean;
  codigo_presenca: string | null;
};

async function montarLista(supabase: ReturnType<typeof supabaseAdmin>) {
  const { data: aulas, error } = await supabase
    .from("aulas")
    .select("id, numero, tema, data, avaliacao_aberta, codigo_presenca")
    .order("numero");

  if (error) throw error;

  const { data: avaliacoes, error: erroAvaliacoes } = await supabase
    .from("avaliacoes")
    .select("aula_id, nota");

  if (erroAvaliacoes) throw erroAvaliacoes;

  const porAula = new Map<string, number[]>();
  for (const a of avaliacoes ?? []) {
    const lista = porAula.get(a.aula_id as string) ?? [];
    lista.push(a.nota as number);
    porAula.set(a.aula_id as string, lista);
  }

  return ((aulas ?? []) as Aula[]).map((aula) => {
    const notas = porAula.get(aula.id) ?? [];
    const media =
      notas.length > 0
        ? Number((notas.reduce((s, n) => s + n, 0) / notas.length).toFixed(1))
        : null;
    return {
      id: aula.id,
      numero: aula.numero,
      tema: aula.tema,
      data: aula.data,
      aberta: aula.avaliacao_aberta,
      codigo: aula.avaliacao_aberta ? aula.codigo_presenca : null,
      totalDeAvaliacoes: notas.length,
      media,
    };
  });
}

export async function POST(request: Request) {
  const admin = await administradorAtual();
  if (!admin) return json({ erro: "Acesso restrito." }, 403);

  const limite = dentroDoLimite(`admin-aulas:${admin.userId}`, 120, 60 * 1000);
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

  const { acao, aulaId } = analise.data;
  const supabase = supabaseAdmin();

  try {
    if (acao === "listar") {
      return json({ aulas: await montarLista(supabase) }, 200);
    }

    if (!aulaId) return json({ erro: "Escolha uma aula." }, 400);

    if (acao === "fechar") {
      const { error } = await supabase
        .from("aulas")
        .update({ avaliacao_aberta: false, fechada_em: new Date().toISOString() })
        .eq("id", aulaId);
      if (error) throw error;

      console.info("[admin] avaliacao fechada", { administrador: admin.userId });
      return json({ aulas: await montarLista(supabase) }, 200);
    }

    // ---- abrir ----
    // Só uma aula pode ficar aberta por vez: senão o mesmo código valeria
    // para duas aulas e a avaliação iria para a errada.
    const { error: erroFechar } = await supabase
      .from("aulas")
      .update({ avaliacao_aberta: false, fechada_em: new Date().toISOString() })
      .eq("avaliacao_aberta", true);
    if (erroFechar) throw erroFechar;

    const codigo = sortearCodigo();
    const { error: erroAbrir } = await supabase
      .from("aulas")
      .update({
        avaliacao_aberta: true,
        codigo_presenca: codigo,
        aberta_em: new Date().toISOString(),
        fechada_em: null,
      })
      .eq("id", aulaId);
    if (erroAbrir) throw erroAbrir;

    const endereco = `${enderecoBase(request)}/avaliar?c=${codigo}`;
    const qrCode = await QRCode.toString(endereco, {
      type: "svg",
      errorCorrectionLevel: "M",
      margin: 1,
      width: 320,
      color: { dark: "#0d2350", light: "#ffffff" },
    });

    console.info("[admin] avaliacao aberta", { administrador: admin.userId });

    return json(
      { aulas: await montarLista(supabase), qrCode, endereco, codigo },
      200,
    );
  } catch (erro) {
    console.error("[admin] falha nas aulas", {
      codigo: (erro as { code?: string })?.code ?? "desconhecido",
    });
    return json({ erro: "Não foi possível concluir a ação. Tente novamente." }, 500);
  }
}

export async function GET() {
  return json({ erro: "Método não permitido." }, 405);
}
