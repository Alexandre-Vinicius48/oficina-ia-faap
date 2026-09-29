import "server-only";

import { supabaseAdmin } from "@/lib/supabase/admin";

/**
 * As inscricoes estao aceitando gente agora?
 *
 * O valor vive no banco, e nao num arquivo do projeto, para que o responsavel
 * possa abrir e fechar pelo painel a qualquer momento — sem esperar uma nova
 * publicacao do site.
 *
 * Em caso de falha ao consultar, devolvemos FECHADO. Melhor uma pessoa ver
 * "inscricoes encerradas" por engano, e procurar a organizacao, do que
 * preencher o formulario inteiro e receber um erro no fim.
 */
export async function inscricoesAbertas(): Promise<boolean> {
  try {
    const { data, error } = await supabaseAdmin()
      .from("configuracoes")
      .select("inscricoes_abertas")
      .maybeSingle();

    if (error) {
      console.error("[configuracoes] falha ao consultar", {
        codigo: error.code ?? "desconhecido",
      });
      return false;
    }

    // Sem linha de configuracao (banco recem-criado), o padrao e aberto.
    if (!data) return true;

    return data.inscricoes_abertas === true;
  } catch {
    return false;
  }
}
