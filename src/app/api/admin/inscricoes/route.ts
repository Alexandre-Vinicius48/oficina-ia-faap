import { NextResponse } from "next/server";
import { z } from "zod";
import { administradorAtual } from "@/lib/auth";
import {
  POR_PAGINA_MAXIMO,
  POR_PAGINA_PADRAO,
  contarInscritos,
  listarInscritos,
} from "@/lib/consulta-inscritos";
import { dentroDoLimite } from "@/lib/limite-requisicoes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Lista de inscritos para o painel administrativo.
 *
 * Usa POST, e nao GET, de proposito: assim o texto pesquisado (que pode ser um
 * CPF) viaja no corpo da requisicao e NUNCA aparece na barra de enderecos,
 * no historico do navegador ou nos logs do servidor.
 *
 * Sem sessao de administrador valida, responde 403 e nao consulta nada.
 */

const consultaSchema = z.object({
  busca: z.string().max(60).optional(),
  pagina: z.number().int().min(1).max(10_000).optional(),
  porPagina: z.number().int().min(5).max(POR_PAGINA_MAXIMO).optional(),
  completo: z.boolean().optional(),
});

export async function POST(request: Request) {
  const admin = await administradorAtual();

  if (!admin) {
    return NextResponse.json(
      { erro: "Acesso restrito." },
      { status: 403, headers: { "Cache-Control": "no-store" } },
    );
  }

  // Limite por administrador, para evitar varredura automatizada da base
  // caso uma sessao seja usada indevidamente.
  const limite = dentroDoLimite(`admin-lista:${admin.userId}`, 240, 60 * 1000);
  if (!limite.permitido) {
    return NextResponse.json(
      { erro: "Muitas consultas seguidas. Aguarde alguns segundos." },
      { status: 429, headers: { "Cache-Control": "no-store" } },
    );
  }

  let corpo: unknown = {};
  try {
    corpo = await request.json();
  } catch {
    corpo = {};
  }

  const analise = consultaSchema.safeParse(corpo);
  if (!analise.success) {
    return NextResponse.json(
      { erro: "Consulta inválida." },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  const { busca = "", pagina = 1, porPagina = POR_PAGINA_PADRAO, completo = false } =
    analise.data;

  if (completo) {
    // Registro de auditoria: quem pediu para ver os documentos completos.
    // Guardamos apenas o identificador do administrador, nunca dados pessoais
    // de inscritos.
    console.info("[admin] exibicao de documentos completos", {
      administrador: admin.userId,
    });
  }

  try {
    const [lista, numeros] = await Promise.all([
      listarInscritos({ busca, pagina, porPagina, completo }),
      contarInscritos(),
    ]);

    return NextResponse.json(
      { ...lista, ...numeros },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json(
      { erro: "Não foi possível carregar a lista de inscritos." },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { erro: "Método não permitido." },
    { status: 405, headers: { "Cache-Control": "no-store" } },
  );
}
