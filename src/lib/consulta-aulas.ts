import "server-only";

import { supabaseAdmin } from "@/lib/supabase/admin";

export type AulaPublica = {
  numero: number;
  tema: string;
  data: string;
  avaliacaoAberta: boolean;
};

/**
 * O cronograma, lido do banco.
 *
 * O banco e a unica fonte de verdade das aulas. Se o cronograma tambem
 * estivesse escrito no arquivo de textos, os dois divergiriam na primeira
 * mudanca de data — e a tela mostraria uma coisa enquanto a avaliacao
 * liberaria outra.
 *
 * O codigo de presenca NAO sai daqui: ele so aparece no painel de quem
 * conduz a aula.
 */
export async function cronograma(): Promise<AulaPublica[]> {
  try {
    const { data, error } = await supabaseAdmin()
      .from("aulas")
      .select("numero, tema, data, avaliacao_aberta")
      .order("numero");

    if (error) {
      console.error("[aulas] falha ao ler cronograma", {
        codigo: error.code ?? "desconhecido",
      });
      return [];
    }

    return (data ?? []).map((a) => ({
      numero: a.numero as number,
      tema: a.tema as string,
      data: a.data as string,
      avaliacaoAberta: a.avaliacao_aberta as boolean,
    }));
  } catch {
    // Sem banco configurado, a pagina ainda abre — so sem o cronograma.
    return [];
  }
}
