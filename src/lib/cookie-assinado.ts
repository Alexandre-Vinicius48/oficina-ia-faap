import "server-only";

import { chaveSecretaSupabase } from "@/lib/env";

/**
 * Cookie assinado, sem tabela de sessao.
 *
 * Guardamos um pequeno conteudo em JSON com uma assinatura HMAC ao lado. Se
 * alguem mudar um caractere, a assinatura nao confere e o acesso e recusado.
 * Nada disso precisa de banco: a sessao vale poucas horas e some sozinha.
 *
 * A chave de assinatura e DERIVADA da chave secreta do Supabase, e nao ela
 * propria. Assim uma eventual falha aqui nao entrega a chave do banco, e o
 * projeto nao precisa de mais uma variavel de ambiente para configurar.
 *
 * Cada uso passa o proprio "proposito" (avaliar uma aula, responder a
 * pesquisa). Propositos diferentes geram chaves diferentes, entao um cookie
 * emitido para uma coisa nao serve para a outra, mesmo sendo bem assinado.
 */

function base64url(dados: Uint8Array): string {
  return Buffer.from(dados).toString("base64url");
}

async function chaveDeAssinatura(proposito: string): Promise<CryptoKey> {
  const material = new TextEncoder().encode(
    `${chaveSecretaSupabase()}::${proposito}`,
  );
  const semente = await crypto.subtle.digest("SHA-256", material);
  return crypto.subtle.importKey(
    "raw",
    semente,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

export async function assinar(
  conteudo: unknown,
  proposito: string,
): Promise<string> {
  const corpo = Buffer.from(JSON.stringify(conteudo)).toString("base64url");
  const chave = await chaveDeAssinatura(proposito);
  const assinatura = await crypto.subtle.sign(
    "HMAC",
    chave,
    new TextEncoder().encode(corpo),
  );
  return `${corpo}.${base64url(new Uint8Array(assinatura))}`;
}

/** Devolve o conteudo quando a assinatura confere, e null em qualquer outro caso. */
export async function conferir<T>(
  valor: string | undefined,
  proposito: string,
): Promise<T | null> {
  if (!valor) return null;

  const [corpo, assinatura] = valor.split(".");
  if (!corpo || !assinatura) return null;

  try {
    const chave = await chaveDeAssinatura(proposito);
    const confere = await crypto.subtle.verify(
      "HMAC",
      chave,
      Buffer.from(assinatura, "base64url"),
      new TextEncoder().encode(corpo),
    );
    if (!confere) return null;

    return JSON.parse(Buffer.from(corpo, "base64url").toString("utf8")) as T;
  } catch {
    return null;
  }
}
