import { z } from "zod";
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
