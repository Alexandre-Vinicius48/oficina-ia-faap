import "server-only";

import { supabaseAdmin } from "@/lib/supabase/admin";
import { mascararCpf, ocultarCpf, somenteDigitos } from "@/lib/format";

export type InscritoLista = {
  id: string;
  nome_completo: string;
  /** Escondido (***.456.789-**) ou completo e formatado (123.456.789-09). */
  cpf: string;
  celular: string; // sempre em numeros; a tela aplica a mascara
  email: string;
  data_inscricao: string; // ISO
};

export type ResultadoLista = {
  itens: InscritoLista[];
  total: number;
  pagina: number;
  porPagina: number;
  totalPaginas: number;
};

export const POR_PAGINA_PADRAO = 25;
export const POR_PAGINA_MAXIMO = 100;

/**
 * Limpa o texto de busca antes de montar o filtro do PostgREST.
 *
 * Virgula, parenteses e aspas tem significado especial na sintaxe de filtros
 * do Supabase. Remove-los evita que alguem escreva um filtro proprio pelo
 * campo de pesquisa. A consulta em si e sempre parametrizada pelo cliente
 * oficial do Supabase, entao nao existe SQL montado com texto do usuario.
 */
export function limparBusca(entrada: string): string {
  return (entrada ?? "")
    .normalize("NFC")
    .replace(/[^\p{L}\p{N}\s@._-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 60);
}

type Parametros = {
  busca?: string;
  pagina?: number;
  porPagina?: number;
  completo?: boolean;
};

/**
 * Lista as inscricoes com busca e paginacao.
 * ATENCAO: quem chama esta funcao JA precisa ter conferido que o usuario e
 * administrador (ver src/lib/auth.ts). Ela usa a chave secreta e ignora RLS.
 */
export async function listarInscritos({
  busca = "",
  pagina = 1,
  porPagina = POR_PAGINA_PADRAO,
  completo = false,
}: Parametros): Promise<ResultadoLista> {
  const supabase = supabaseAdmin();

  const paginaSegura = Math.max(1, Math.floor(pagina) || 1);
  const tamanho = Math.min(
    POR_PAGINA_MAXIMO,
    Math.max(5, Math.floor(porPagina) || POR_PAGINA_PADRAO),
  );

  let consulta = supabase
    .from("inscricoes")
    .select("id, nome_completo, cpf, celular, email, data_inscricao", {
      count: "exact",
    })
    .order("data_inscricao", { ascending: false })
    .order("id", { ascending: false });

  const termo = limparBusca(busca);

  if (termo.length >= 2) {
    const digitos = somenteDigitos(termo);
    const filtros: string[] = [
      `nome_completo.ilike.%${termo}%`,
      `email.ilike.%${termo}%`,
    ];
    if (digitos.length >= 3) {
      filtros.push(`cpf.ilike.%${digitos}%`, `celular.ilike.%${digitos}%`);
    }
    consulta = consulta.or(filtros.join(","));
  }

  const de = (paginaSegura - 1) * tamanho;
  const ate = de + tamanho - 1;

  const { data, error, count } = await consulta.range(de, ate);

  if (error) {
    // Log tecnico, sem nenhum dado pessoal.
    console.error("[admin] falha ao listar inscritos", {
      codigo: error.code ?? "desconhecido",
    });
    throw new Error("Não foi possível carregar a lista de inscritos.");
  }

  const total = count ?? 0;

  const itens: InscritoLista[] = (data ?? []).map((linha) => ({
    id: linha.id as string,
    nome_completo: linha.nome_completo as string,
    // Mesmo revelado, o CPF sai formatado: e assim que a pessoa le no
    // documento, entao e assim que o responsavel confere.
    cpf: completo
      ? mascararCpf(linha.cpf as string)
      : ocultarCpf(linha.cpf as string),
    celular: linha.celular as string,
    email: linha.email as string,
    data_inscricao: linha.data_inscricao as string,
  }));

  return {
    itens,
    total,
    pagina: paginaSegura,
    porPagina: tamanho,
    totalPaginas: Math.max(1, Math.ceil(total / tamanho)),
  };
}

/** Total geral e total do dia (fuso de Sao Paulo). Somente numeros. */
export async function contarInscritos(): Promise<{ total: number; hoje: number }> {
  const supabase = supabaseAdmin();

  const hojeSaoPaulo = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date()); // formato AAAA-MM-DD

  const [geral, doDia] = await Promise.all([
    supabase.from("inscricoes").select("id", { count: "exact", head: true }),
    supabase
      .from("inscricoes")
      .select("id", { count: "exact", head: true })
      .eq("data_inscricao_local", hojeSaoPaulo),
  ]);

  if (geral.error || doDia.error) {
    console.error("[admin] falha ao contar inscritos", {
      codigo: geral.error?.code ?? doDia.error?.code ?? "desconhecido",
    });
    throw new Error("Não foi possível carregar os números da oficina.");
  }

  return { total: geral.count ?? 0, hoje: doDia.count ?? 0 };
}
