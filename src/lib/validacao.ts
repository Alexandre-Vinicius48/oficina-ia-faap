import { z } from "zod";
import { NOTA_MAXIMA } from "@/lib/escala";
import {
  CHAVES_PESQUISA,
  ESCALA_PESQUISA,
  LIMITE_DE_PALAVRAS_PESQUISA,
  PERGUNTAS_ABERTAS,
} from "@/lib/pesquisa";
import { normalizarEmail, normalizarNome, somenteDigitos } from "@/lib/format";

/**
 * Validacao do CPF pelos digitos verificadores (algoritmo oficial da
 * Receita Federal). Pega erro de digitacao, nao so tamanho errado.
 */
export function cpfEhValido(entrada: string): boolean {
  const cpf = somenteDigitos(entrada);
  if (cpf.length !== 11) return false;
  // Sequencias como 111.111.111-11 passam na conta, mas nao existem.
  if (/^(\d)\1{10}$/.test(cpf)) return false;

  const digito = (atePosicao: number): number => {
    let soma = 0;
    let peso = atePosicao + 1;
    for (let i = 0; i < atePosicao; i += 1) {
      soma += Number(cpf[i]) * peso;
      peso -= 1;
    }
    const resto = (soma * 10) % 11;
    return resto === 10 ? 0 : resto;
  };

  return digito(9) === Number(cpf[9]) && digito(10) === Number(cpf[10]);
}

/** Celular brasileiro: DDD valido + 8 ou 9 digitos. */
export function celularEhValido(entrada: string): boolean {
  const d = somenteDigitos(entrada);
  if (d.length !== 10 && d.length !== 11) return false;
  const ddd = Number(d.slice(0, 2));
  if (ddd < 11 || ddd > 99) return false;
  // Celular com 11 digitos sempre comeca com 9 depois do DDD.
  if (d.length === 11 && d[2] !== "9") return false;
  // Numero repetido (99999999999) e erro de digitacao.
  if (/^(\d)\1+$/.test(d)) return false;
  return true;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/;

export function emailEhValido(entrada: string): boolean {
  const e = normalizarEmail(entrada);
  return e.length <= 254 && EMAIL_REGEX.test(e);
}

/**
 * Esquema unico usado no navegador E no servidor.
 * As mensagens sao escritas em linguagem simples, do jeito que a pessoa
 * precisa ler para saber o que corrigir.
 */
export const inscricaoSchema = z.object({
  nome_completo: z
    .string({ error: "Digite seu nome completo." })
    .transform(normalizarNome)
    .refine((v) => v.length >= 3, { message: "Digite seu nome completo." })
    .refine((v) => v.length <= 120, { message: "O nome digitado é muito longo." })
    .refine((v) => v.includes(" "), {
      message: "Digite seu nome e também seu sobrenome.",
    })
    .refine((v) => /^[\p{L}\p{M}'\s.-]+$/u.test(v), {
      message: "Use apenas letras no nome.",
    }),

  cpf: z
    .string({ error: "Digite um CPF válido." })
    .transform(somenteDigitos)
    .refine(cpfEhValido, { message: "Digite um CPF válido." }),

  celular: z
    .string({ error: "Digite um número de celular válido." })
    .transform(somenteDigitos)
    .refine(celularEhValido, {
      message: "Digite um número de celular válido com DDD.",
    }),

  email: z
    .string({ error: "Digite um e-mail válido." })
    .transform(normalizarEmail)
    .refine(emailEhValido, {
      message: "Digite um e-mail válido. Exemplo: nome@email.com",
    }),

  consentimento_lgpd: z.literal(true, {
    error: "Marque a autorização de uso dos seus dados para continuar.",
  }),
});

export type DadosInscricao = z.infer<typeof inscricaoSchema>;

/** Campos do formulario, como aparecem na tela (ainda com mascara). */
export type CamposFormulario = {
  nome_completo: string;
  cpf: string;
  celular: string;
  email: string;
  consentimento_lgpd: boolean;
};

export type ErrosFormulario = Partial<Record<keyof CamposFormulario, string>>;

/** Roda o esquema e devolve os erros ja separados por campo. */
export function validarFormulario(campos: CamposFormulario): {
  ok: boolean;
  erros: ErrosFormulario;
  dados?: DadosInscricao;
} {
  const resultado = inscricaoSchema.safeParse(campos);
  if (resultado.success) {
    return { ok: true, erros: {}, dados: resultado.data };
  }
  const erros: ErrosFormulario = {};
  for (const problema of resultado.error.issues) {
    const campo = problema.path[0] as keyof CamposFormulario | undefined;
    if (campo && !erros[campo]) {
      erros[campo] = problema.message;
    }
  }
  return { ok: false, erros };
}

/* ===========================================================================
   AVALIACAO DA AULA
   =========================================================================== */

/** Quantas palavras o comentario pode ter. */
export const LIMITE_DE_PALAVRAS = 100;

export function contarPalavras(texto: string): number {
  const limpo = (texto ?? "").trim();
  if (limpo === "") return 0;
  return limpo.split(/\s+/).length;
}

/** Dados que a pessoa envia para entrar na area de avaliacao. */
export const entradaAvaliacaoSchema = z.object({
  celular: z
    .string({ error: "Digite seu celular." })
    .transform(somenteDigitos)
    .refine(celularEhValido, {
      message: "Digite o celular com DDD, o mesmo que você usou na inscrição.",
    }),

  codigo: z
    .string({ error: "Digite o código da aula." })
    .transform((v) => somenteDigitos(v))
    .refine((v) => v.length === 4, {
      message: "O código tem 4 números. Ele aparece na tela da sala.",
    }),
});

/** Dados da avaliacao em si. */
export const avaliacaoSchema = z.object({
  nota: z
    .number({ error: "Escolha um rosto para dar sua nota." })
    .int()
    .min(1, { message: "Escolha um rosto para dar sua nota." })
    .max(NOTA_MAXIMA, { message: "Escolha um rosto para dar sua nota." }),

  comentario: z
    .string()
    .max(1200, { message: "Seu comentário ficou muito longo." })
    .transform((v) => v.trim())
    .refine((v) => contarPalavras(v) <= LIMITE_DE_PALAVRAS, {
      message: `Escreva no máximo ${LIMITE_DE_PALAVRAS} palavras.`,
    })
    .optional()
    .default(""),
});

/* ===========================================================================
   QUESTIONARIO FINAL
   =========================================================================== */

const VALORES_DA_ESCALA = ESCALA_PESQUISA.map((o) => o.valor);

/** Uma resposta escrita do questionario: opcional, com limite de palavras. */
const respostaEscrita = z
  .string()
  .max(1200, { message: "Sua resposta ficou muito longa." })
  .transform((v) => v.trim())
  .refine((v) => contarPalavras(v) <= LIMITE_DE_PALAVRAS_PESQUISA, {
    message: `Escreva no máximo ${LIMITE_DE_PALAVRAS_PESQUISA} palavras.`,
  })
  .optional()
  .default("");

/**
 * O envio do questionario.
 *
 * Todas as 28 afirmacoes sao obrigatorias — a propria escala oferece
 * "Nao sei / Nao se aplica" para quem nao quiser opinar, entao deixar em
 * branco nao e uma recusa, e um esquecimento. Com a pergunta em branco
 * aceita, metade da planilha chegaria vazia e a pesquisa perderia o sentido.
 *
 * O esquema e montado a partir da lista de perguntas: acrescentar uma
 * afirmacao em @/lib/pesquisa passa a exigi-la aqui automaticamente, sem
 * ninguem precisar lembrar de mexer na validacao.
 */
export const pesquisaSchema = z.object({
  respostas: z.object(
    Object.fromEntries(
      CHAVES_PESQUISA.map((chave) => [
        chave,
        z
          .number({ error: "Falta responder uma pergunta." })
          .int()
          .refine((v) => VALORES_DA_ESCALA.includes(v), {
            message: "Escolha uma das alternativas.",
          }),
      ]),
    ) as Record<string, z.ZodType<number>>,
  ),
  ...Object.fromEntries(
    PERGUNTAS_ABERTAS.map((p) => [p.coluna, respostaEscrita]),
  ),
});

/** Dados que a pessoa envia para entrar no questionario final. */
export const entradaPesquisaSchema = z.object({
  celular: z
    .string({ error: "Digite seu celular." })
    .transform(somenteDigitos)
    .refine(celularEhValido, {
      message: "Digite o celular com DDD, o mesmo que você usou na inscrição.",
    }),

  codigo: z
    .string({ error: "Digite o código mostrado na sala." })
    .transform((v) => somenteDigitos(v))
    .refine((v) => v.length === 4, {
      message: "O código tem 4 números. Ele aparece na tela da sala.",
    }),
});
