import "server-only";

import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { chavePublicaSupabase, urlSupabase } from "@/lib/env";

/**
 * Cliente do servidor ligado aos cookies da pessoa que esta navegando.
 * Usado para descobrir QUEM esta logado. Continua usando a chave publica,
 * portanto nao consegue burlar a RLS.
 */
export async function supabaseServidor() {
  const armazemCookies = await cookies();

  return createServerClient(urlSupabase(), chavePublicaSupabase(), {
    cookies: {
      getAll() {
        return armazemCookies.getAll();
      },
      setAll(listaCookies) {
        try {
          for (const { name, value, options } of listaCookies) {
            armazemCookies.set(name, value, options);
          }
        } catch {
          // Server Components nao podem escrever cookies. O middleware ja
          // cuida de renovar a sessao, entao aqui podemos ignorar.
        }
      },
    },
  });
}
