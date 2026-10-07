import "server-only";

import { assinar, conferir } from "@/lib/cookie-assinado";

/**
 * Sessao curta do participante que vai avaliar a aula.
 *
 * Depois de acertar telefone + codigo de presenca, gravamos um cookie que diz
 * "esta pessoa, nesta aula, ate tal hora". A assinatura e o formato do cookie
 * estao em @/lib/cookie-assinado, compartilhados com a sessao da pesquisa
 * final — o proposito ("sessao-avaliacao") entra na chave, entao um cookie de
 * avaliacao nao abre a pesquisa nem o contrario.
 */

const DURACAO_MS = 3 * 60 * 60 * 1000; // 3 horas
const PROPOSITO = "sessao-avaliacao";
export const NOME_COOKIE = "avaliacao_sessao";

type Conteudo = {
  /** id da inscricao */
  i: string;
  /** id da aula */
  a: string;
  /** validade, em milissegundos desde 1970 */
  v: number;
};

export async function criarSessao(
  inscricaoId: string,
  aulaId: string,
): Promise<{ valor: string; duracaoSegundos: number }> {
  const conteudo: Conteudo = {
    i: inscricaoId,
    a: aulaId,
    v: Date.now() + DURACAO_MS,
  };

  return {
    valor: await assinar(conteudo, PROPOSITO),
    duracaoSegundos: Math.floor(DURACAO_MS / 1000),
  };
}

export async function lerSessao(
  valor: string | undefined,
): Promise<{ inscricaoId: string; aulaId: string } | null> {
  const conteudo = await conferir<Conteudo>(valor, PROPOSITO);
  if (!conteudo?.i || !conteudo?.a) return null;
  if (typeof conteudo.v !== "number" || conteudo.v < Date.now()) return null;
  return { inscricaoId: conteudo.i, aulaId: conteudo.a };
}
