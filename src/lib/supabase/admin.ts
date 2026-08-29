import "server-only";

import { createClient } from "@supabase/supabase-js";
import { chaveSecretaSupabase, urlSupabase } from "@/lib/env";

/**
 * Cliente com a chave SECRETA (service_role).
 *
 * ATENCAO: este arquivo importa "server-only". Se algum componente de
 * navegador tentar importa-lo, o build do Next.js FALHA na hora. E a
 * garantia tecnica de que a chave secreta nunca chega ao navegador.
 *
 * Este cliente ignora a RLS, entao so pode ser usado depois que o codigo
 * ja conferiu quem esta chamando.
 */
export function supabaseAdmin() {
  return createClient(urlSupabase(), chaveSecretaSupabase(), {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
}
