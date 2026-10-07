import "server-only";

import { supabaseAdmin } from "@/lib/supabase/admin";
import { ROSTOS } from "@/lib/escala";
import {
  concordanciaDaPergunta,
  ESCALA_PESQUISA,
  mediaDaPergunta,
  NUMERO_DA_PERGUNTA,
  PERGUNTAS_ABERTAS,
  SECOES_PESQUISA,
  type ColunaAberta,
} from "@/lib/pesquisa";

/**
 * OS NUMEROS DO DASHBOARD.
 *
 * Tudo e calculado aqui, no servidor, e chega pronto na tela. Sao poucas
 * dezenas de linhas no banco: trazer tudo e contar em memoria sai mais
 * simples, e mais facil de conferir, do que espalhar agregacoes em SQL.
 *
 * A pagina do dashboard e sempre dinamica e so abre para administrador, por
 * isso nao ha cache nenhum: o numero que aparece e o numero de agora.
 */

export type ResumoAula = {
  numero: number;
  tema: string;
  data: string;
  total: number;
  media: number | null;
  /** Quantas respostas em cada nota, na ordem de ROSTOS. */
  distribuicao: number[];
  comentarios: number;
};

export type ResumoPergunta = {
  chave: string;
  numero: number;
  secao: string;
  texto: string;
  total: number;
  media: number | null;
  concordancia: number | null;
  /** Quantas pessoas marcaram cada alternativa, na ordem de ESCALA_PESQUISA. */
  contagens: number[];
};

export type ResumoSecao = {
  titulo: string;
  media: number | null;
  concordancia: number | null;
  perguntas: ResumoPergunta[];
};

export type TextoEscrito = {
  nome: string;
  coluna: ColunaAberta;
  pergunta: string;
  texto: string;
};

export type DadosDashboard = {
  inscritos: number;
  aulas: ResumoAula[];
  totalDeAvaliacoes: number;
  mediaGeralDasAulas: number | null;
  quantosAvaliaramAlgumaAula: number;
  pesquisa: {
    respostas: number;
    secoes: ResumoSecao[];
    perguntas: ResumoPergunta[];
    mediaGeral: number | null;
    concordanciaGeral: number | null;
    satisfacaoGeral: ResumoPergunta | null;
    textos: TextoEscrito[];
  };
};

function media(valores: number[]): number | null {
  if (valores.length === 0) return null;
  return Number((valores.reduce((s, v) => s + v, 0) / valores.length).toFixed(2));
}

export async function dadosDoDashboard(): Promise<DadosDashboard> {
  const supabase = supabaseAdmin();

  const [resAulas, resAvaliacoes, resInscritos, resPesquisa] = await Promise.all([
    supabase.from("aulas").select("id, numero, tema, data").order("numero"),
    supabase
      .from("avaliacoes")
      .select("aula_id, inscricao_id, nota, comentario"),
    supabase.from("inscricoes").select("id, nome_completo"),
    supabase
      .from("pesquisa_respostas")
      .select("inscricao_id, respostas, mais_gostou, melhorar, como_usar, created_at")
      .order("created_at", { ascending: true }),
  ]);

  const aulasBrutas = (resAulas.data ?? []) as {
    id: string;
    numero: number;
    tema: string;
    data: string;
  }[];
  const avaliacoes = (resAvaliacoes.data ?? []) as {
    aula_id: string;
    inscricao_id: string;
    nota: number;
    comentario: string | null;
  }[];
  const inscritos = (resInscritos.data ?? []) as {
    id: string;
    nome_completo: string;
  }[];
  const respostasPesquisa = (resPesquisa.data ?? []) as {
    inscricao_id: string;
    respostas: Record<string, number> | null;
    mais_gostou: string | null;
    melhorar: string | null;
    como_usar: string | null;
  }[];

  /* ------------------------- avaliacoes das aulas ------------------------- */

  const aulas: ResumoAula[] = aulasBrutas.map((aula) => {
    const daAula = avaliacoes.filter((a) => a.aula_id === aula.id);
    return {
      numero: aula.numero,
      tema: aula.tema,
      data: aula.data,
      total: daAula.length,
      media: media(daAula.map((a) => a.nota)),
      distribuicao: ROSTOS.map(
        (r) => daAula.filter((a) => a.nota === r.nota).length,
      ),
      comentarios: daAula.filter((a) => (a.comentario ?? "").trim() !== "").length,
    };
  });

  /* --------------------------- questionario final -------------------------- */

  const nomePor = new Map(inscritos.map((i) => [i.id, i.nome_completo]));

  const resumoDaPergunta = (
    chave: string,
    texto: string,
    secao: string,
  ): ResumoPergunta => {
    const valores = respostasPesquisa
      .map((r) => r.respostas?.[chave])
      .filter((v): v is number => typeof v === "number");

    return {
      chave,
      numero: NUMERO_DA_PERGUNTA.get(chave) ?? 0,
      secao,
      texto,
      total: valores.length,
      media: mediaDaPergunta(valores),
      concordancia: concordanciaDaPergunta(valores),
      contagens: ESCALA_PESQUISA.map(
        (o) => valores.filter((v) => v === o.valor).length,
      ),
    };
  };

  const secoes: ResumoSecao[] = SECOES_PESQUISA.map((secao) => {
    const perguntas = secao.perguntas.map((p) =>
      resumoDaPergunta(p.chave, p.texto, secao.titulo),
    );
    const medias = perguntas
      .map((p) => p.media)
      .filter((m): m is number => m !== null);
    const concordancias = perguntas
      .map((p) => p.concordancia)
      .filter((c): c is number => c !== null);

    return {
      titulo: secao.titulo,
      media: media(medias),
      concordancia:
        concordancias.length > 0
          ? Math.round(
              concordancias.reduce((s, c) => s + c, 0) / concordancias.length,
            )
          : null,
      perguntas,
    };
  });

  const perguntas = secoes.flatMap((s) => s.perguntas);
  const mediasDasPerguntas = perguntas
    .map((p) => p.media)
    .filter((m): m is number => m !== null);
  const concordanciasDasPerguntas = perguntas
    .map((p) => p.concordancia)
    .filter((c): c is number => c !== null);

  const textos: TextoEscrito[] = respostasPesquisa.flatMap((r) =>
    PERGUNTAS_ABERTAS.flatMap((pergunta) => {
      const texto = (r[pergunta.coluna] ?? "").trim();
      if (texto === "") return [];
      return [
        {
          nome: nomePor.get(r.inscricao_id) ?? "(inscrição removida)",
          coluna: pergunta.coluna,
          pergunta: pergunta.texto,
          texto,
        },
      ];
    }),
  );

  return {
    inscritos: inscritos.length,
    aulas,
    totalDeAvaliacoes: avaliacoes.length,
    mediaGeralDasAulas: media(avaliacoes.map((a) => a.nota)),
    quantosAvaliaramAlgumaAula: new Set(avaliacoes.map((a) => a.inscricao_id))
      .size,
    pesquisa: {
      respostas: respostasPesquisa.length,
      secoes,
      perguntas,
      mediaGeral: media(mediasDasPerguntas),
      concordanciaGeral:
        concordanciasDasPerguntas.length > 0
          ? Math.round(
              concordanciasDasPerguntas.reduce((s, c) => s + c, 0) /
                concordanciasDasPerguntas.length,
            )
          : null,
      satisfacaoGeral:
        perguntas.find((p) => p.chave === "satisfacao_geral") ?? null,
      textos,
    },
  };
}
