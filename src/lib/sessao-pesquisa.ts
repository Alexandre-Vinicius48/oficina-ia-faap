import "server-only";

import { assinar, conferir } from "@/lib/cookie-assinado";

/**
 * Sessao curta de quem vai responder ao questionario final.
 *
 * Mesma ideia da sessao de avaliacao, com duas diferencas:
 *
 *  · nao guarda aula nenhuma — a pesquisa e sobre a oficina inteira;
 *  · dura mais (6 horas). Sao 28 afirmacoes e tres perguntas escritas; uma
 *    pessoa que pare no meio, converse, volte depois, nao pode perder o
 *    acesso e ter de pedir o codigo de novo.
 */

const DURACAO_MS = 6 * 60 * 60 * 1000; // 6 horas
const PROPOSITO = "sessao-pesquisa";
export const NOME_COOKIE = "pesquisa_sessao";

type Conteudo = {
  /** id da inscricao */
  i: string;
  /** validade, em milissegundos desde 1970 */
  v: number;
};

export async function criarSessao(
  inscricaoId: string,
): Promise<{ valor: string; duracaoSegundos: number }> {
  const conteudo: Conteudo = { i: inscricaoId, v: Date.now() + DURACAO_MS };
  return {
    valor: await assinar(conteudo, PROPOSITO),
    duracaoSegundos: Math.floor(DURACAO_MS / 1000),
  };
}

export async function lerSessao(
  valor: string | undefined,
): Promise<{ inscricaoId: string } | null> {
  const conteudo = await conferir<Conteudo>(valor, PROPOSITO);
  if (!conteudo?.i) return null;
  if (typeof conteudo.v !== "number" || conteudo.v < Date.now()) return null;
  return { inscricaoId: conteudo.i };
}
