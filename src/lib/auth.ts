import "server-only";

import { supabaseAdmin } from "@/lib/supabase/admin";
import { supabaseServidor } from "@/lib/supabase/servidor";

export type AdministradorLogado = {
  userId: string;
  email: string;
  nome: string | null;
};

/**
 * Confere, no servidor, se quem esta chamando e um administrador de verdade.
 *
 * Sao duas conferencias:
 *  1. getUser() pergunta ao proprio Supabase se o token da sessao e valido
 *     (nao confiamos no cookie sozinho, que poderia ser forjado);
 *  2. o usuario precisa estar cadastrado na tabela admin_users.
 *
 * Devolve null quando nao e administrador. Nunca lanca o motivo para a tela,
 * para nao ajudar quem estiver tentando adivinhar.
 */
export async function administradorAtual(): Promise<AdministradorLogado | null> {
  const supabase = await supabaseServidor();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) return null;

  const admin = supabaseAdmin();
  const { data: registro, error: erroRegistro } = await admin
    .from("admin_users")
    .select("user_id, email, nome")
    .eq("user_id", data.user.id)
    .maybeSingle();

  if (erroRegistro || !registro) return null;

  return {
    userId: registro.user_id as string,
    email: (registro.email as string) ?? data.user.email ?? "",
    nome: (registro.nome as string | null) ?? null,
  };
}
