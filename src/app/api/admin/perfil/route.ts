import { NextResponse } from "next/server";
import { administradorAtual } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Diz apenas se quem esta logado tem permissao de administrador.
 * Nao devolve nenhum dado de inscrito.
 */
export async function GET() {
  const admin = await administradorAtual();

  if (!admin) {
    return NextResponse.json(
      { administrador: false },
      { status: 403, headers: { "Cache-Control": "no-store" } },
    );
  }

  return NextResponse.json(
    { administrador: true, nome: admin.nome, email: admin.email },
    { headers: { "Cache-Control": "no-store" } },
  );
}
