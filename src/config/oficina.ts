/**
 * =============================================================================
 * TEXTOS E INFORMACOES DA OFICINA
 * =============================================================================
 * Este e o UNICO arquivo que precisa ser alterado para mudar textos, data,
 * horario, local, contato, slides do carrossel ou legendas das fotos.
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

  /** Frase de destaque. */
  chamada: "Aprenda a usar a Inteligência Artificial de forma simples, criativa e prática.",

  /** Parágrafo de apresentação. */
  descricao:
    "Uma iniciativa da FAAP em parceria com o Bairro com Vida para promover inclusão digital e aproximar pessoas idosas das novas tecnologias.",

  /** Frases institucionais da parceria. */
  parceria: {
    selo: "Uma parceria para inclusão digital",
    lema: "Tecnologia que aproxima.",
  },

  /**
   * Data, horário e local.
   * Deixe qualquer campo como string vazia ("") para ele NÃO aparecer no site.
   */
  encontro: {
    data: "",       // exemplo: "Sábado, 10 de outubro de 2026"
    horario: "",    // exemplo: "das 14h às 17h"
    local: "",      // exemplo: "FAAP — Rua Alagoas, 903 — Higienópolis, São Paulo"
    observacao: "A data e o local serão confirmados por telefone ou e-mail.",
  },

  /** Contato mostrado no rodapé. Deixe "" para esconder. */
  contato: {
    email: "",      // exemplo: "oficina.ia@exemplo.com"
    whatsapp: "",   // exemplo: "(11) 90000-0000"
  },

  /**
   * Slides do carrossel da página inicial.
   * As fotos ficam na pasta public/fotos. Para trocar uma foto, salve o novo
   * arquivo lá e mude o nome em "foto" abaixo.
   * O campo "alternativo" é lido em voz alta por leitores de tela — descreva
   * a cena em poucas palavras.
   */
  slides: [
    {
      foto: "/fotos/apoio-individual.jpg",
      alternativo:
        "Aluna da FAAP ajudando duas senhoras a usarem um tablet, sentadas a uma mesa.",
      titulo: "Aprenda IA com apoio humano",
      texto:
        "Um aluno da FAAP acompanha você de perto, no seu ritmo, quantas vezes for preciso.",
    },
    {
      foto: "/fotos/criacao-com-ia.jpg",
      alternativo:
        "Grupo de pessoas idosas e alunos da FAAP olhando tablets com imagens criadas por Inteligência Artificial.",
      titulo: "Crie imagens com Inteligência Artificial",
      texto:
        "Transforme uma ideia escrita em desenhos, cartões e fotos — usando só palavras.",
    },
    {
      foto: "/fotos/aula-em-grupo.jpg",
      alternativo:
        "Instrutor da FAAP explicando Inteligência Artificial para um grupo de pessoas idosas em uma sala clara.",
      titulo: "Descubra como fazer vídeos com IA",
      texto:
        "Veja, passo a passo, como transformar suas histórias em pequenos vídeos.",
    },
    {
      foto: "/fotos/acolhimento.jpg",
      alternativo:
        "Aluna da FAAP mostrando o celular para um senhor e uma senhora, todos sorrindo.",
      titulo: "Inclusão digital com acolhimento",
      texto:
        "Ninguém fica para trás: aqui não existe pergunta boba nem pressa para aprender.",
    },
  ],

  /** Assuntos da oficina, exibidos como cartões. */
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

  /** Os três passos da matrícula, mostrados com números grandes. */
  passos: [
    {
      titulo: "Preencha o formulário",
      texto:
        "São quatro campos simples: nome, CPF, celular e e-mail. Leva menos de dois minutos.",
    },
    {
      titulo: "Receba a confirmação",
      texto:
        "Assim que enviar, sua vaga fica registrada e aparece a confirmação na tela.",
    },
    {
      titulo: "Aguarde nosso contato",
      texto:
        "A organização entra em contato por telefone ou e-mail com a data, o horário e o local.",
    },
  ],

  /** Galeria institucional da página inicial. */
  galeria: [
    {
      foto: "/fotos/acolhimento.jpg",
      alternativo:
        "Aluna da FAAP mostrando o celular para um casal de idosos, todos sorrindo.",
      legenda: "Atendimento próximo, no ritmo de cada pessoa",
    },
    {
      foto: "/fotos/aula-em-grupo.jpg",
      alternativo:
        "Instrutor apresentando Inteligência Artificial em uma tela para um grupo de idosos.",
      legenda: "Explicações claras, sem palavras difíceis",
    },
    {
      foto: "/fotos/criacao-com-ia.jpg",
      alternativo:
        "Pessoas idosas e alunos da FAAP criando imagens e vídeos com Inteligência Artificial.",
      legenda: "Mão na massa: imagens e vídeos criados por você",
    },
  ],
} as const;

/** Nome do arquivo Excel baixado no painel administrativo. */
export const NOME_ARQUIVO_EXCEL = "inscritos_oficina_ia_faap.xlsx";
