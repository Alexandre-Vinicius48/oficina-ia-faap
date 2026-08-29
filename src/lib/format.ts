/**
 * Funcoes de formatacao usadas na tela (mascaras) e na exportacao.
 * Regra do projeto: no banco guardamos apenas numeros; a mascara e enfeite
 * de interface.
 */

export function somenteDigitos(valor: string): string {
  return (valor ?? "").replace(/\D+/g, "");
}

/** 12345678909 -> 123.456.789-09 (aceita valor parcial enquanto a pessoa digita) */
export function mascararCpf(valor: string): string {
  const d = somenteDigitos(valor).slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

/** 11999998888 -> (11) 99999-8888 | 1133334444 -> (11) 3333-4444 */
export function mascararCelular(valor: string): string {
  const d = somenteDigitos(valor).slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : "";
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

/**
 * Esconde o CPF para exibicao no painel: 123.456.789-09 -> ***.456.789-**
 * Mantem o miolo para o responsavel conseguir conferir a pessoa sem
 * expor o documento inteiro na tela.
 */
export function ocultarCpf(cpfDigitos: string): string {
  const d = somenteDigitos(cpfDigitos);
  if (d.length !== 11) return "***.***.***-**";
  return `***.${d.slice(3, 6)}.${d.slice(6, 9)}-**`;
}

/** RG mascarado para a tabela: mostra apenas os 2 ultimos caracteres. */
export function ocultarRg(rg: string): string {
  const limpo = (rg ?? "").trim();
  if (limpo.length <= 2) return "*".repeat(Math.max(limpo.length, 4));
  return `${"*".repeat(limpo.length - 2)}${limpo.slice(-2)}`;
}

/** Guarda o RG normalizado: sem pontos/tracos/espacos e em maiusculas. */
export function normalizarRg(valor: string): string {
  return (valor ?? "")
    .toUpperCase()
    .replace(/[^0-9A-Z]/g, "")
    .slice(0, 20);
}

export function normalizarEmail(valor: string): string {
  return (valor ?? "").trim().toLowerCase();
}

/** Tira espacos duplicados e espacos das pontas do nome. */
export function normalizarNome(valor: string): string {
  return (valor ?? "").replace(/\s+/g, " ").trim().slice(0, 120);
}

const FUSO = "America/Sao_Paulo";

/** ISO -> 28/08/2026 (sempre no horario de Sao Paulo) */
export function formatarData(iso: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: FUSO,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(iso));
}

/** ISO -> 14:35 */
export function formatarHora(iso: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: FUSO,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(iso));
}
