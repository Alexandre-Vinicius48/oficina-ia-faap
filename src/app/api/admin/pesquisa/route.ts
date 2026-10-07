import { NextResponse } from "next/server";
import QRCode from "qrcode";
import { z } from "zod";
import { administradorAtual } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { dentroDoLimite } from "@/lib/limite-requisicoes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * O QUESTIONARIO FINAL, PELO PAINEL ADMINISTRATIVO.
 *
 * Uma rota so, com cinco acoes:
 *   listar    -> se a pesquisa esta aberta, o codigo da vez e quantos ja responderam
 *   abrir     -> sorteia um codigo novo e libera a pesquisa
 *   fechar    -> encerra
 *   respostas -> as respostas, com o nome de quem escreveu
 *   excluir   -> apaga uma resposta (um teste, por exemplo)
 *
 * Ao abrir, devolvemos o QR Code ja desenhado, para projetar na sala. O
 * endereco dentro do QR ja leva o codigo, entao o participante so precisa
 * digitar o proprio celular.
 */

const corpoSchema = z.object({
  acao: z.enum(["listar", "abrir", "fechar", "respostas", "excluir"]),
  id: z.string().uuid().optional(),
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

async function montarEstado(supabase: ReturnType<typeof supabaseAdmin>) {
  const [resConfig, resRespostas] = await Promise.all([
    supabase
      .from("configuracoes")
      .select("pesquisa_aberta, pesquisa_codigo")
      .maybeSingle(),
    supabase.from("pesquisa_respostas").select("id"),
  ]);

  if (resConfig.error) throw resConfig.error;
  if (resRespostas.error) throw resRespostas.error;

  const aberta = resConfig.data?.pesquisa_aberta === true;
  return {
    aberta,
    // O codigo so existe enquanto a pesquisa esta aberta.
    codigo: aberta ? (resConfig.data?.pesquisa_codigo ?? null) : null,
    total: (resRespostas.data ?? []).length,
  };
}

export async function POST(request: Request) {
  const admin = await administradorAtual();
  if (!admin) return json({ erro: "Acesso restrito." }, 403);

  const limite = dentroDoLimite(`admin-pesquisa:${admin.userId}`, 120, 60 * 1000);
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

  const { acao, id } = analise.data;
  const supabase = supabaseAdmin();

  try {
    if (acao === "listar") {
      return json({ estado: await montarEstado(supabase) }, 200);
    }

    if (acao === "respostas") {
      const { data, error } = await supabase
        .from("pesquisa_respostas")
        .select("id, inscricao_id, respostas, mais_gostou, melhorar, como_usar, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;

      const { data: inscritos, error: erroInscritos } = await supabase
        .from("inscricoes")
        .select("id, nome_completo");
      if (erroInscritos) throw erroInscritos;

      const nomePor = new Map(
        (inscritos ?? []).map((i) => [i.id as string, i.nome_completo as string]),
      );

      // Devolve o nome e descarta o id da inscricao: a tela precisa de quem
      // respondeu, nao do vinculo com o cadastro.
      const itens = (data ?? []).map((r) => ({
        id: r.id,
        nome: nomePor.get(r.inscricao_id as string) ?? "(inscrição removida)",
        respostas: r.respostas ?? {},
        mais_gostou: r.mais_gostou,
        melhorar: r.melhorar,
        como_usar: r.como_usar,
        created_at: r.created_at,
      }));

      return json({ itens }, 200);
    }

    if (acao === "excluir") {
      if (!id) return json({ erro: "Escolha uma resposta." }, 400);
      const { error } = await supabase
        .from("pesquisa_respostas")
        .delete()
        .eq("id", id);
      if (error) throw error;

      console.info("[admin] resposta do questionario excluida", {
        administrador: admin.userId,
      });
      return json({ estado: await montarEstado(supabase) }, 200);
    }

    if (acao === "fechar") {
      const { error } = await supabase
        .from("configuracoes")
        .upsert({ id: true, pesquisa_aberta: false }, { onConflict: "id" });
      if (error) throw error;

      console.info("[admin] questionario final fechado", {
        administrador: admin.userId,
      });
      return json({ estado: await montarEstado(supabase) }, 200);
    }

    // ---- abrir ----
    const codigo = sortearCodigo();
    const { error: erroAbrir } = await supabase.from("configuracoes").upsert(
      {
        id: true,
        pesquisa_aberta: true,
        pesquisa_codigo: codigo,
        pesquisa_aberta_em: new Date().toISOString(),
      },
      { onConflict: "id" },
    );
    if (erroAbrir) throw erroAbrir;

    const endereco = `${enderecoBase(request)}/pesquisa?c=${codigo}`;
    const qrCode = await QRCode.toString(endereco, {
      type: "svg",
      errorCorrectionLevel: "M",
      margin: 1,
      width: 320,
      color: { dark: "#0d2350", light: "#ffffff" },
    });

    console.info("[admin] questionario final aberto", {
      administrador: admin.userId,
    });

    return json(
      { estado: await montarEstado(supabase), qrCode, endereco, codigo },
      200,
    );
  } catch (erro) {
    console.error("[admin] falha no questionario final", {
      codigo: (erro as { code?: string })?.code ?? "desconhecido",
    });
    return json({ erro: "Não foi possível concluir a ação. Tente novamente." }, 500);
  }
}

export async function GET() {
  return json({ erro: "Método não permitido." }, 405);
}
