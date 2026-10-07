/**
 * O QUESTIONARIO FINAL DA OFICINA.
 *
 * Transcricao do formulario "Pesquisa de satisfacao · Avaliacao geral dos
 * quatro encontros". E a unica fonte de verdade das perguntas: a tela do
 * participante, a planilha e o dashboard leem todos daqui. Mudar o texto de
 * uma afirmacao e acrescentar uma linha neste arquivo — nada de banco.
 *
 * Fica em lib, e nao junto do componente, porque e usada nos dois lados: na
 * tela do participante (navegador) e nas rotas de servidor que montam o
 * Excel. Um modulo marcado "use client" nao pode ser importado por uma rota
 * de servidor — ele chegaria vazio.
 *
 * As CHAVES sao o nome da resposta dentro do banco. Nunca renomeie uma
 * chave ja usada: as respostas gravadas ficariam orfas. Para trocar uma
 * pergunta, crie uma chave nova.
 */

export type OpcaoPesquisa = {
  /** 5 = concorda totalmente ... 1 = discorda totalmente. 0 = nao sei. */
  valor: number;
  rotulo: string;
  /** Rotulo curto, para caber no eixo de um grafico ou numa coluna. */
  curto: string;
  cor: string;
};

/**
 * A escala, do mais positivo para o mais negativo.
 *
 * "Nao sei / Nao se aplica" vale 0 de proposito, e nao 3: ela nao e um meio
 * termo, e sim uma recusa a responder. Entra nas contagens, fica FORA das
 * medias — somar "nao sei" como se fosse nota puxaria o resultado para baixo
 * sem que ninguem tivesse discordado de nada.
 */
export const ESCALA_PESQUISA: OpcaoPesquisa[] = [
  { valor: 5, rotulo: "Concordo totalmente", curto: "Concordo tot.", cor: "var(--color-sucesso-700)" },
  { valor: 4, rotulo: "Concordo", curto: "Concordo", cor: "var(--color-vida-verde)" },
  { valor: 3, rotulo: "Nem concordo, nem discordo", curto: "Neutro", cor: "var(--color-vida-amarelo)" },
  { valor: 2, rotulo: "Discordo", curto: "Discordo", cor: "var(--color-vida-laranja)" },
  { valor: 1, rotulo: "Discordo totalmente", curto: "Discordo tot.", cor: "var(--color-erro-600)" },
  { valor: 0, rotulo: "Não sei / Não se aplica", curto: "Não sei", cor: "var(--color-tinta-suave)" },
];

/** Valor usado por quem escolheu "Nao sei / Nao se aplica". */
export const NAO_SEI = 0;

/** A escala sem o "nao sei" — as opcoes que entram na media. */
export const ESCALA_CONCORDANCIA = ESCALA_PESQUISA.filter(
  (o) => o.valor !== NAO_SEI,
);

export type PerguntaPesquisa = { chave: string; texto: string };
export type SecaoPesquisa = { titulo: string; perguntas: PerguntaPesquisa[] };

export const SECOES_PESQUISA: SecaoPesquisa[] = [
  {
    titulo: "Organização geral da Oficina",
    perguntas: [
      { chave: "org_bem_organizada", texto: "A Oficina SabedorIA foi bem organizada." },
      { chave: "org_duracao_encontros", texto: "A duração de cada encontro foi adequada." },
      {
        chave: "org_quantidade_encontros",
        texto:
          "A quantidade de quatro encontros foi adequada para aprender os assuntos apresentados.",
      },
    ],
  },
  {
    titulo: "Ambiente, infraestrutura e acessibilidade",
    perguntas: [
      { chave: "amb_local_confortavel", texto: "O local da Oficina era confortável e adequado." },
      {
        chave: "amb_acompanhar_tela",
        texto: "Consegui acompanhar as explicações apresentadas na tela.",
      },
      {
        chave: "amb_ajuda_equipamentos",
        texto:
          "Recebi ajuda adequada quando tive dificuldades com os equipamentos ou recursos digitais.",
      },
    ],
  },
  {
    titulo: "Equipe (professores e alunos)",
    perguntas: [
      { chave: "equipe_explicou_claro", texto: "A equipe explicou os assuntos de maneira clara." },
      { chave: "equipe_paciencia", texto: "A equipe teve paciência para esclarecer minhas dúvidas." },
      {
        chave: "equipe_respeito",
        texto: "Fui tratado(a) com respeito e atenção durante toda a Oficina.",
      },
    ],
  },
  {
    titulo: "Conteúdo apresentado",
    perguntas: [
      { chave: "conteudo_interessante", texto: "Os assuntos apresentados foram interessantes para mim." },
      {
        chave: "conteudo_linguagem_facil",
        texto: "Os conteúdos foram explicados em uma linguagem fácil de entender.",
      },
      {
        chave: "conteudo_exemplos_cotidiano",
        texto: "Os exemplos utilizados tinham relação com situações do meu dia a dia.",
      },
    ],
  },
  {
    titulo: "Atividades práticas e metodologia",
    perguntas: [
      {
        chave: "pratica_oportunidades",
        texto: "Tive oportunidades suficientes para praticar o que foi ensinado.",
      },
      { chave: "pratica_faceis_entender", texto: "As atividades práticas foram fáceis de entender." },
      {
        chave: "pratica_consegui_realizar",
        texto: "Consegui realizar as atividades com a ajuda disponível.",
      },
    ],
  },
  {
    titulo: "Conhecimentos e habilidades adquiridos",
    perguntas: [
      {
        chave: "aprend_compreendo_ia",
        texto: "Agora compreendo melhor o que é Inteligência Artificial.",
      },
      {
        chave: "aprend_perguntas_instrucoes",
        texto:
          "Aprendi a fazer perguntas e dar instruções para uma ferramenta de Inteligência Artificial.",
      },
      {
        chave: "aprend_criar_conteudo",
        texto:
          "Aprendi a utilizar a Inteligência Artificial para criar ou melhorar textos, imagens e vídeos curtos.",
      },
    ],
  },
  {
    titulo: "Confiança, segurança e autonomia digital",
    perguntas: [
      {
        chave: "confianca_usar_ia",
        texto:
          "Depois da Oficina, sinto mais confiança para utilizar ferramentas de Inteligência Artificial.",
      },
      {
        chave: "confianca_conferir_informacoes",
        texto:
          "Aprendi que devo conferir as informações fornecidas pela Inteligência Artificial, além de evitar compartilhar com as ferramentas de IA informações pessoais.",
      },
      {
        chave: "confianca_novas_tecnologias",
        texto: "Sinto-me mais preparado(a) para experimentar novas tecnologias.",
      },
    ],
  },
  {
    titulo: "Utilidade prática e impacto no cotidiano",
    perguntas: [
      { chave: "uso_pretendo_usar", texto: "Pretendo utilizar a Inteligência Artificial no meu dia a dia." },
      {
        chave: "uso_imagino_situacoes",
        texto: "Consigo imaginar situações em que a Inteligência Artificial pode me ajudar.",
      },
      {
        chave: "uso_continuar_aprendendo",
        texto: "Pretendo continuar aprendendo sobre Inteligência Artificial depois da Oficina.",
      },
    ],
  },
  {
    titulo: "Inclusão digital, convivência e participação social",
    perguntas: [
      { chave: "inclusao_a_vontade", texto: "Senti-me à vontade para participar e fazer perguntas." },
      {
        chave: "inclusao_minha_idade",
        texto:
          "Senti que pessoas da minha idade também podem aprender a utilizar Inteligência Artificial.",
      },
      {
        chave: "inclusao_mundo_digital",
        texto: "A Oficina contribuiu para que eu me sentisse mais incluído(a) no mundo digital.",
      },
    ],
  },
  {
    titulo: "Satisfação geral",
    perguntas: [
      {
        chave: "satisfacao_geral",
        texto: "De maneira geral, fiquei satisfeito(a) com a Oficina SabedorIA.",
      },
    ],
  },
];

/** Todas as afirmacoes, fora das secoes, na ordem em que aparecem na tela. */
export const PERGUNTAS_PESQUISA: PerguntaPesquisa[] = SECOES_PESQUISA.flatMap(
  (s) => s.perguntas,
);

export const CHAVES_PESQUISA = PERGUNTAS_PESQUISA.map((p) => p.chave);
export const TOTAL_DE_PERGUNTAS = PERGUNTAS_PESQUISA.length;

/** A posicao de cada pergunta na lista, começando em 1 (usada na tela). */
export const NUMERO_DA_PERGUNTA = new Map<string, number>(
  PERGUNTAS_PESQUISA.map((p, i) => [p.chave, i + 1]),
);

/** A secao a que cada pergunta pertence, para a planilha e o dashboard. */
export const SECAO_DA_PERGUNTA = new Map<string, string>(
  SECOES_PESQUISA.flatMap((s) => s.perguntas.map((p) => [p.chave, s.titulo])),
);

/* ---------------------------------------------------------------------------
   Perguntas abertas
   ------------------------------------------------------------------------ */

/**
 * As tres perguntas de texto livre. A "coluna" e o nome do campo no banco —
 * estas nao ficam no jsonb porque sao poucas, fixas, e dao menos trabalho de
 * ler direto em SQL quando alguem quiser.
 */
export const PERGUNTAS_ABERTAS = [
  {
    coluna: "mais_gostou" as const,
    texto: "O que você mais gostou na Oficina SabedorIA?",
  },
  {
    coluna: "melhorar" as const,
    texto: "O que poderíamos melhorar nas próximas edições da Oficina?",
  },
  {
    coluna: "como_usar" as const,
    texto: "Como você pretende utilizar a Inteligência Artificial depois da Oficina?",
  },
];

export type ColunaAberta = (typeof PERGUNTAS_ABERTAS)[number]["coluna"];

/** Quantas palavras cada resposta escrita pode ter. */
export const LIMITE_DE_PALAVRAS_PESQUISA = 120;

/* ---------------------------------------------------------------------------
   Contas usadas pelo painel, pelo dashboard e pela planilha
   ------------------------------------------------------------------------ */

export function rotuloDaOpcao(valor: number): string {
  return ESCALA_PESQUISA.find((o) => o.valor === valor)?.rotulo ?? "";
}

/**
 * Media de uma pergunta, de 1 a 5, IGNORANDO quem marcou "nao sei".
 * Devolve null quando ninguem deu uma nota de verdade.
 */
export function mediaDaPergunta(valores: number[]): number | null {
  const validos = valores.filter((v) => v >= 1 && v <= 5);
  if (validos.length === 0) return null;
  return Number((validos.reduce((s, v) => s + v, 0) / validos.length).toFixed(2));
}

/**
 * Percentual de concordancia: quantos, entre quem opinou, marcaram
 * "Concordo" ou "Concordo totalmente". E a leitura mais direta de uma escala
 * Likert — mais facil de explicar a uma banca do que uma media de 1 a 5.
 */
export function concordanciaDaPergunta(valores: number[]): number | null {
  const validos = valores.filter((v) => v >= 1 && v <= 5);
  if (validos.length === 0) return null;
  const concordam = validos.filter((v) => v >= 4).length;
  return Math.round((concordam / validos.length) * 100);
}
