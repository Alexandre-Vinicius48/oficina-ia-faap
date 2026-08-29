/**
 * =============================================================================
 * TEXTOS E INFORMACOES DA OFICINA
 * =============================================================================
 * Este e o UNICO arquivo que precisa ser alterado para mudar textos, data,
 * horario, local ou contato da oficina. Nao e preciso mexer em mais nada.
 *
 * Depois de salvar as alteracoes, envie para o GitHub (git push) e a Vercel
 * publica a nova versao sozinha em poucos minutos.
 * =============================================================================
 */

export const OFICINA = {
  /** Titulo grande da pagina inicial. */
  titulo: "Oficina de Inteligência Artificial",

  /** Aparece logo abaixo do titulo. */
  subtitulo: "FAAP + Bairro com Vida",

  /** Frase de apresentação. */
  chamada: "Aprenda a usar a Inteligência Artificial de forma simples, segura e prática.",

  /** Parágrafo explicativo da página inicial. */
  descricao:
    "Uma oficina criada por alunos da FAAP para ajudar você a descobrir como a Inteligência Artificial pode facilitar tarefas, criar imagens, vídeos, textos e muito mais.",

  /**
   * Data, horário e local.
   * Deixe qualquer campo como string vazia ("") para ele NÃO aparecer no site.
   * Exemplo: local: "" esconde o bloco de local.
   */
  encontro: {
    data: "",       // exemplo: "Sábado, 10 de outubro de 2026"
    horario: "",    // exemplo: "das 14h às 17h"
    local: "",      // exemplo: "FAAP - Rua Alagoas, 903 - Higienópolis, São Paulo"
    observacao: "A data e o local serão confirmados por telefone ou e-mail.",
  },

  /** Contato mostrado no rodapé. Deixe "" para esconder. */
  contato: {
    email: "",      // exemplo: "oficina.ia@exemplo.com"
    whatsapp: "",   // exemplo: "(11) 90000-0000"
  },

  /** Assuntos da oficina, exibidos como cartões na página inicial. */
  temas: [
    {
      icone: "lampada",
      titulo: "O que é Inteligência Artificial",
      texto: "Entenda, sem complicação, o que é e para que serve essa tecnologia.",
    },
    {
      icone: "conversa",
      titulo: "Como conversar com uma IA",
      texto: "Aprenda a fazer perguntas e a pedir as coisas do jeito certo.",
    },
    {
      icone: "escrita",
      titulo: "Como criar bons pedidos",
      texto: "Pequenos ajustes no que você escreve mudam muito o resultado.",
    },
    {
      icone: "imagem",
      titulo: "Criação de imagens",
      texto: "Faça desenhos, cartões e fotos criativas usando apenas palavras.",
    },
    {
      icone: "video",
      titulo: "Criação de vídeos",
      texto: "Veja como transformar suas ideias em pequenos vídeos.",
    },
    {
      icone: "casa",
      titulo: "Usos práticos no dia a dia",
      texto: "Receitas, listas, textos, lembretes e ajuda com tarefas comuns.",
    },
    {
      icone: "escudo",
      titulo: "Cuidado com golpes",
      texto: "Como reconhecer mensagens falsas e se proteger na internet.",
    },
  ],
} as const;

/** Nome do arquivo Excel baixado no painel administrativo. */
export const NOME_ARQUIVO_EXCEL = "inscritos_oficina_ia_faap.xlsx";
