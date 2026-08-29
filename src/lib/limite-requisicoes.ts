import "server-only";

/**
 * Protecao basica contra spam / envios automatizados.
 *
 * Janela deslizante guardada na memoria do servidor. Nao guardamos o IP:
 * usamos uma "impressao digital" (hash) que nao permite voltar ao IP
 * original, e ela e apagada sozinha quando a janela termina. Assim atendemos
 * a LGPD sem deixar o formulario aberto para robos.
 */

type Janela = { contagem: number; expiraEm: number };

const registros = new Map<string, Janela>();
const LIMITE_DE_MEMORIA = 5_000;

function limparExpirados(agora: number) {
  for (const [chave, janela] of registros) {
    if (janela.expiraEm <= agora) registros.delete(chave);
  }
}

export function dentroDoLimite(
  identificador: string,
  maximo: number,
  janelaMs: number,
): { permitido: boolean; tenteEmSegundos: number } {
  const agora = Date.now();

  if (registros.size > LIMITE_DE_MEMORIA) limparExpirados(agora);

  const atual = registros.get(identificador);

  if (!atual || atual.expiraEm <= agora) {
    registros.set(identificador, { contagem: 1, expiraEm: agora + janelaMs });
    return { permitido: true, tenteEmSegundos: 0 };
  }

  if (atual.contagem >= maximo) {
    return {
      permitido: false,
      tenteEmSegundos: Math.ceil((atual.expiraEm - agora) / 1000),
    };
  }

  atual.contagem += 1;
  return { permitido: true, tenteEmSegundos: 0 };
}

/**
 * Transforma o IP em um identificador curto e irreversivel.
 * O IP em si nunca e guardado nem registrado em log.
 */
export async function impressaoDigital(cabecalhos: Headers): Promise<string> {
  const ip =
    cabecalhos.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    cabecalhos.get("x-real-ip") ||
    "desconhecido";

  const semente = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "sem-semente";
  const dados = new TextEncoder().encode(`${semente}:${ip}`);
  const digest = await crypto.subtle.digest("SHA-256", dados);
  return Array.from(new Uint8Array(digest).slice(0, 8))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
