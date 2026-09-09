/**
 * A escala de avaliacao das aulas.
 *
 * Fica em lib, e nao junto do componente, porque e usada nos dois lados:
 * pela tela do participante (navegador) e pelo painel administrativo, que
 * monta o grafico no servidor. Um modulo marcado "use client" nao pode ser
 * importado por uma rota de servidor.
 *
 * O banco aceita notas de 1 a 5 de proposito, e nao so ate 4: se um dia a
 * escala voltar a ter cinco rostos, basta acrescentar a linha aqui, sem
 * precisar mexer no banco de novo.
 */
export type Rosto = {
  nota: number;
  rotulo: string;
  cor: string;
};

export const ROSTOS: Rosto[] = [
  { nota: 1, rotulo: "Ruim", cor: "var(--color-erro-600)" },
  { nota: 2, rotulo: "Regular", cor: "var(--color-vida-laranja)" },
  { nota: 3, rotulo: "Bom", cor: "var(--color-vida-verde)" },
  { nota: 4, rotulo: "Muito bom", cor: "var(--color-sucesso-700)" },
];

/** Maior nota aceita, derivada da escala. */
export const NOTA_MAXIMA = ROSTOS.length;
