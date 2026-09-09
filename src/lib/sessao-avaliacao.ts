import "server-only";

import { chaveSecretaSupabase } from "@/lib/env";

/**
 * Sessao curta do participante que vai avaliar a aula.
 *
 * Depois de acertar telefone + codigo de presenca, gravamos um cookie que diz
 * "esta pessoa, nesta aula, ate tal hora". O cookie e ASSINADO: se alguem
 * mudar um caractere, a assinatura nao confere e o acesso e recusado.
 *
 * Nao guardamos sessao no banco de proposito. A sessao vale poucas horas e
 * some sozinha; uma tabela so para isso seria mais uma coisa a manter e mais
 * um lugar guardando vinculo entre pessoa e aula.
 */

const DURACAO_MS = 3 * 60 * 60 * 1000; // 3 horas
export const NOME_COOKIE = "avaliacao_sessao";

type Conteudo = {
  /** id da inscricao */
  i: string;
  /** id da aula */
  a: string;
  /** validade, em milissegundos desde 1970 */
  v: number;
};

function base64url(dados: Uint8Array): string {
  return Buffer.from(dados).toString("base64url");
}

/**
 * A chave de assinatura e derivada da chave secreta do Supabase, e nao ela
 * propria. Assim uma eventual falha aqui nao entrega a chave do banco, e o
 * projeto nao precisa de mais uma variavel de ambiente para configurar.
 */
async function chaveDeAssinatura(): Promise<CryptoKey> {
  const material = new TextEncoder().encode(
    `${chaveSecretaSupabase()}::sessao-avaliacao`,
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

export async function criarSessao(
  inscricaoId: string,
  aulaId: string,
): Promise<{ valor: string; duracaoSegundos: number }> {
  const conteudo: Conteudo = {
    i: inscricaoId,
    a: aulaId,
    v: Date.now() + DURACAO_MS,
  };

  const corpo = Buffer.from(JSON.stringify(conteudo)).toString("base64url");
  const chave = await chaveDeAssinatura();
  const assinatura = await crypto.subtle.sign(
    "HMAC",
    chave,
    new TextEncoder().encode(corpo),
  );

  return {
    valor: `${corpo}.${base64url(new Uint8Array(assinatura))}`,
    duracaoSegundos: Math.floor(DURACAO_MS / 1000),
  };
}

export async function lerSessao(
  valor: string | undefined,
): Promise<{ inscricaoId: string; aulaId: string } | null> {
  if (!valor) return null;

  const [corpo, assinatura] = valor.split(".");
  if (!corpo || !assinatura) return null;

  try {
    const chave = await chaveDeAssinatura();
    const confere = await crypto.subtle.verify(
      "HMAC",
      chave,
      Buffer.from(assinatura, "base64url"),
      new TextEncoder().encode(corpo),
    );
    if (!confere) return null;

    const conteudo = JSON.parse(
      Buffer.from(corpo, "base64url").toString("utf8"),
    ) as Conteudo;

    if (!conteudo?.i || !conteudo?.a) return null;
    if (typeof conteudo.v !== "number" || conteudo.v < Date.now()) return null;

    return { inscricaoId: conteudo.i, aulaId: conteudo.a };
  } catch {
    return null;
  }
}
