/**
 * Leitura das variaveis de ambiente com mensagem de erro clara.
 *
 * NEXT_PUBLIC_*  -> pode aparecer no navegador (sao valores publicos).
 * SUPABASE_SERVICE_ROLE_KEY -> chave SECRETA. Nunca tem prefixo NEXT_PUBLIC_,
 *                              entao o Next.js nunca a envia para o navegador.
 */

function obrigatoria(nome: string, valor: string | undefined): string {
  if (!valor || valor.trim() === "") {
    throw new Error(
      `Variável de ambiente ausente: ${nome}. ` +
        `Confira o arquivo .env.local (ou as variáveis do projeto na Vercel).`,
    );
  }
  return valor.trim();
}

export function urlSupabase(): string {
  return obrigatoria("NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL);
}

export function chavePublicaSupabase(): string {
  return obrigatoria(
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

export function chaveSecretaSupabase(): string {
  return obrigatoria(
    "SUPABASE_SERVICE_ROLE_KEY",
    process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
}
