"use client";

import { useEffect, useState } from "react";

/**
 * Confetes e baloes na tela de confirmacao da inscricao.
 *
 * Decisoes que importam para o publico da oficina:
 *
 *  · quem pediu menos animacao no sistema operacional NAO ve nada. Nem uma
 *    versao reduzida: o componente simplesmente nao monta. Animacao em tela
 *    cheia incomoda quem tem labirintite ou enxaqueca, e isso e comum na
 *    faixa etaria da oficina;
 *  · dura poucos segundos e se remove sozinha, em vez de ficar rodando
 *    para sempre atras do texto;
 *  · fica atras do conteudo, sem capturar clique, e escondida de leitores
 *    de tela — e enfeite, nao informacao;
 *  · as pecas so sao sorteadas depois que a pagina monta. Sortear durante a
 *    renderizacao daria um resultado no servidor e outro no navegador, e o
 *    React reclamaria da diferenca.
 */

/** Cores da identidade: azul da FAAP e o coracao do Bairro com Vida. */
const CORES = [
  "var(--color-marca-500)",
  "var(--color-marca-700)",
  "var(--color-vida-roxo)",
  "var(--color-vida-verde)",
  "var(--color-vida-azul)",
  "var(--color-vida-laranja)",
  "var(--color-vida-amarelo)",
  "var(--color-acolhe-500)",
];

const QUANTIDADE_DE_CONFETES = 44;
const QUANTIDADE_DE_BALOES = 9;
const DURACAO_TOTAL_MS = 7000;

type Confete = {
  chave: string;
  esquerda: number;
  largura: number;
  altura: number;
  cor: string;
  atraso: number;
  duracao: number;
  deriva: number;
  giro: number;
};

type Balao = {
  chave: string;
  esquerda: number;
  tamanho: number;
  cor: string;
  atraso: number;
  duracao: number;
  deriva: number;
};

function sortear(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function escolher<T>(lista: readonly T[]): T {
  return lista[Math.floor(Math.random() * lista.length)] as T;
}

export function Comemoracao({ ativo }: { ativo: boolean }) {
  const [pecas, setPecas] = useState<{
    confetes: Confete[];
    baloes: Balao[];
  } | null>(null);

  useEffect(() => {
    if (!ativo) return;

    // Respeita a preferencia do sistema operacional.
    const prefereMenosMovimento = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (prefereMenosMovimento) return;

    // Sorteia logo depois, e nao aqui dentro. Dois motivos: mudar estado de
    // forma sincrona dentro de um efeito dispara renderizacoes em cascata, e
    // assim a festa so comeca depois que o texto ja apareceu na tela — a
    // mensagem vem primeiro, o enfeite depois.
    //
    // De proposito NAO usamos requestAnimationFrame aqui: ele nao dispara
    // enquanto a aba esta em segundo plano. Quem enviasse a inscricao e
    // trocasse de aba na mesma hora voltaria e encontraria os confetes
    // comecando fora de hora, ou presos na tela depois do prazo de limpeza.
    const inicio = setTimeout(() => {
      setPecas({
        confetes: Array.from({ length: QUANTIDADE_DE_CONFETES }, (_, i) => ({
          chave: `c${i}`,
          esquerda: sortear(0, 100),
          largura: sortear(7, 12),
          altura: sortear(10, 18),
          cor: escolher(CORES),
          atraso: sortear(0, 1.6),
          duracao: sortear(3, 4.6),
          deriva: sortear(-14, 14),
          giro: sortear(360, 900),
        })),
        baloes: Array.from({ length: QUANTIDADE_DE_BALOES }, (_, i) => ({
          chave: `b${i}`,
          esquerda: sortear(2, 92),
          tamanho: sortear(34, 58),
          cor: escolher(CORES),
          atraso: sortear(0, 2),
          duracao: sortear(4.5, 6.5),
          deriva: sortear(-8, 8),
        })),
      });
    }, 0);

    // Some sozinha: sem isso o navegador seguiria desenhando para sempre.
    const fim = setTimeout(() => setPecas(null), DURACAO_TOTAL_MS);

    return () => {
      clearTimeout(inicio);
      clearTimeout(fim);
    };
  }, [ativo]);

  if (!pecas) return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
    >
      {pecas.confetes.map((c) => (
        <span
          key={c.chave}
          className="confete"
          style={
            {
              left: `${c.esquerda}%`,
              width: `${c.largura}px`,
              height: `${c.altura}px`,
              backgroundColor: c.cor,
              "--atraso": `${c.atraso}s`,
              "--duracao": `${c.duracao}s`,
              "--deriva": `${c.deriva}vw`,
              "--giro": `${c.giro}deg`,
            } as React.CSSProperties
          }
        />
      ))}

      {pecas.baloes.map((b) => (
        <span
          key={b.chave}
          className="balao"
          style={
            {
              left: `${b.esquerda}%`,
              "--atraso": `${b.atraso}s`,
              "--duracao": `${b.duracao}s`,
              "--deriva": `${b.deriva}vw`,
            } as React.CSSProperties
          }
        >
          <svg
            width={b.tamanho}
            height={b.tamanho * 1.7}
            viewBox="0 0 40 68"
            fill="none"
          >
            <ellipse cx="20" cy="22" rx="18" ry="22" fill={b.cor} />
            {/* brilho, para o balao nao parecer uma mancha chapada */}
            <ellipse cx="13" cy="14" rx="5" ry="7" fill="white" opacity="0.35" />
            <path d="M20 44 l-3 4 h6 z" fill={b.cor} />
            <path
              d="M20 48 q5 6 0 11 q-5 5 0 9"
              stroke={b.cor}
              strokeWidth="1.5"
              fill="none"
              opacity="0.65"
            />
          </svg>
        </span>
      ))}
    </div>
  );
}
