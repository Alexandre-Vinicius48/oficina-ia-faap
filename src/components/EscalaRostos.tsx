"use client";

/**
 * Escala Likert de 5 pontos, com rostos.
 *
 * Cuidados que fazem diferenca para o publico da oficina:
 *  · cada rosto vem com o rotulo escrito embaixo. Rosto sozinho e ambiguo,
 *    e quem nao enxerga bem a expressao fica sem saber o que escolheu;
 *  · a cor NAO carrega a informacao sozinha — quem nao distingue verde de
 *    vermelho continua lendo o texto e a expressao;
 *  · sao botoes de radio de verdade, entao setas do teclado funcionam e o
 *    leitor de tela anuncia "opcao 4 de 5";
 *  · alvos grandes, com area de toque folgada.
 */

export type Rosto = {
  nota: number;
  rotulo: string;
  cor: string;
};

export const ROSTOS: Rosto[] = [
  { nota: 1, rotulo: "Muito ruim", cor: "var(--color-erro-600)" },
  { nota: 2, rotulo: "Ruim", cor: "var(--color-vida-laranja)" },
  { nota: 3, rotulo: "Regular", cor: "var(--color-vida-amarelo)" },
  { nota: 4, rotulo: "Bom", cor: "var(--color-vida-verde)" },
  { nota: 5, rotulo: "Muito bom", cor: "var(--color-sucesso-700)" },
];

/** Caminho da boca para cada nota: da mais triste a mais sorridente. */
const BOCAS: Record<number, string> = {
  1: "M 22 46 Q 32 34 42 46",
  2: "M 22 44 Q 32 38 42 44",
  3: "M 22 42 L 42 42",
  4: "M 22 40 Q 32 46 42 40",
  5: "M 21 38 Q 32 50 43 38",
};

function Rostinho({ nota, cor }: { nota: number; cor: string }) {
  return (
    <svg viewBox="0 0 64 64" className="h-14 w-14" aria-hidden="true" focusable="false">
      <circle cx="32" cy="32" r="27" fill="none" stroke={cor} strokeWidth="3.5" />
      <circle cx="23" cy="26" r="3.4" fill={cor} />
      <circle cx="41" cy="26" r="3.4" fill={cor} />
      <path
        d={BOCAS[nota]}
        fill="none"
        stroke={cor}
        strokeWidth="3.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function EscalaRostos({
  valor,
  aoEscolher,
  desabilitado = false,
  erro,
}: {
  valor: number | null;
  aoEscolher: (nota: number) => void;
  desabilitado?: boolean;
  erro?: string;
}) {
  return (
    <fieldset
      className={`rounded-2xl border-2 p-5 ${
        erro ? "border-erro-600 bg-erro-50" : "border-borda bg-white"
      }`}
      aria-describedby={erro ? "erro-nota" : undefined}
    >
      <legend className="px-2 text-[1.15rem] font-extrabold text-tinta">
        O que você achou da aula de hoje?
      </legend>

      {/* No celular os cinco viram linhas largas, uma embaixo da outra.
          Lado a lado em tela estreita cada alvo ficaria com cerca de 40px de
          largura — abaixo do minimo recomendado, e apertado demais para quem
          tem a mao tremida. A partir de tela media eles voltam a ficar lado
          a lado, onde ha espaco de sobra. */}
      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-5 sm:gap-3">
        {ROSTOS.map((rosto) => {
          const escolhido = valor === rosto.nota;
          return (
            <label
              key={rosto.nota}
              className={`flex cursor-pointer items-center gap-4 rounded-2xl border-2 px-4 py-3 transition sm:flex-col sm:gap-2 sm:px-2 ${
                escolhido
                  ? "border-marca-600 bg-marca-50 ring-2 ring-marca-600"
                  : "border-borda hover:bg-papel-alt sm:border-transparent"
              } ${desabilitado ? "cursor-not-allowed opacity-60" : ""}`}
            >
              <input
                type="radio"
                name="nota"
                value={rosto.nota}
                checked={escolhido}
                disabled={desabilitado}
                onChange={() => aoEscolher(rosto.nota)}
                className="sr-only"
              />
              <Rostinho nota={rosto.nota} cor={rosto.cor} />
              <span
                className={`text-[1.1rem] leading-tight font-bold sm:text-center sm:text-[1rem] ${
                  escolhido ? "text-marca-800" : "text-tinta-suave"
                }`}
              >
                {rosto.rotulo}
              </span>
              {escolhido && (
                <span className="sr-only">selecionado</span>
              )}
            </label>
          );
        })}
      </div>

      {erro && (
        <p
          id="erro-nota"
          role="alert"
          className="mt-4 flex items-start gap-2 text-[1.05rem] font-bold text-erro-700"
        >
          <span aria-hidden="true">⚠</span>
          {erro}
        </p>
      )}
    </fieldset>
  );
}
