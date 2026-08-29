"use client";

import Image from "next/image";
import { useId, useRef, useState } from "react";
import { Icone } from "@/components/Icones";
import { OFICINA } from "@/config/oficina";

/**
 * Carrossel de destaques.
 *
 * Decisoes pensadas no publico da oficina:
 *  · NAO passa sozinho. Slide que troca sem aviso e um dos maiores problemas
 *    de acessibilidade que existem: atrapalha quem le devagar e quem usa
 *    leitor de tela. Quem manda aqui e a pessoa.
 *  · setas grandes, com area de toque folgada;
 *  · funciona com as setas do teclado;
 *  · cada troca e anunciada por leitores de tela (aria-live);
 *  · todos os slides ficam no HTML, so o atual e visivel — assim a leitura
 *    por voz e a busca do navegador continuam funcionando.
 */
export function Carrossel() {
  const slides = OFICINA.slides;
  const [atual, setAtual] = useState(0);
  const regiao = useRef<HTMLDivElement>(null);
  const idBase = useId();

  const total = slides.length;
  const normalizar = (indice: number) => ((indice % total) + total) % total;

  /**
   * Anda um slide para frente ou para tras.
   *
   * Usa a forma "anterior => novo" de proposito: se a pessoa clicar duas vezes
   * seguidas na seta — coisa comum para quem acha que o primeiro clique nao
   * pegou — os dois cliques contam. Lendo o valor direto do estado, o segundo
   * clique leria o numero antigo e o carrossel andaria uma vez so.
   */
  const avancar = (passo: number) =>
    setAtual((anterior) => normalizar(anterior + passo));

  const irPara = (indice: number) => setAtual(normalizar(indice));

  function aoTeclar(evento: React.KeyboardEvent) {
    if (evento.key === "ArrowRight") {
      evento.preventDefault();
      avancar(1);
    }
    if (evento.key === "ArrowLeft") {
      evento.preventDefault();
      avancar(-1);
    }
  }

  return (
    <div
      ref={regiao}
      role="group"
      aria-roledescription="carrossel"
      aria-label="Destaques da oficina"
      onKeyDown={aoTeclar}
      tabIndex={-1}
      className="relative"
    >
      <div className="overflow-hidden rounded-3xl border-2 border-borda bg-white shadow-lg">
        <div className="grid lg:grid-cols-2">
          {/* ---------- Foto ---------- */}
          <div className="relative aspect-[4/3] w-full lg:aspect-auto lg:min-h-[26rem]">
            {slides.map((slide, indice) => (
              <Image
                key={slide.foto}
                src={slide.foto}
                alt={slide.alternativo}
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                priority={indice === 0}
                className={`object-cover transition-opacity duration-500 ${
                  indice === atual ? "opacity-100" : "opacity-0"
                }`}
                aria-hidden={indice === atual ? undefined : true}
              />
            ))}
          </div>

          {/* ---------- Texto ---------- */}
          <div className="flex flex-col justify-center gap-5 p-7 sm:p-10">
            <p className="text-[0.95rem] font-bold tracking-[0.14em] text-acolhe-700 uppercase">
              Destaque {atual + 1} de {total}
            </p>

            {slides.map((slide, indice) => (
              <div
                key={slide.titulo}
                id={`${idBase}-slide-${indice}`}
                hidden={indice !== atual}
              >
                <h3 className="text-[1.6rem] leading-tight font-extrabold text-marca-900 sm:text-[1.9rem]">
                  {slide.titulo}
                </h3>
                <p className="mt-4 text-[1.15rem] leading-relaxed text-tinta-suave">
                  {slide.texto}
                </p>
              </div>
            ))}

            {/* Anuncia a troca para quem usa leitor de tela. */}
            <p aria-live="polite" className="sr-only">
              {`Destaque ${atual + 1} de ${total}: ${slides[atual]?.titulo ?? ""}`}
            </p>

            {/* ---------- Controles ---------- */}
            <div className="mt-2 flex items-center gap-4">
              <button
                type="button"
                onClick={() => avancar(-1)}
                aria-label="Ver o destaque anterior"
                className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-2 border-marca-600 bg-white text-marca-700 transition hover:bg-marca-50"
              >
                <Icone nome="seta" className="h-7 w-7 rotate-180" />
              </button>

              <button
                type="button"
                onClick={() => avancar(1)}
                aria-label="Ver o próximo destaque"
                className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-2 border-marca-600 bg-marca-700 text-white transition hover:bg-marca-800"
              >
                <Icone nome="seta" className="h-7 w-7" />
              </button>

              {/* Bolinhas: mostram onde a pessoa esta e levam direto ao slide. */}
              <ul className="ml-2 flex items-center gap-2">
                {slides.map((slide, indice) => (
                  <li key={slide.foto}>
                    <button
                      type="button"
                      onClick={() => irPara(indice)}
                      aria-label={`Ir para o destaque ${indice + 1}: ${slide.titulo}`}
                      aria-current={indice === atual ? "true" : undefined}
                      className={`block h-4 rounded-full transition-all ${
                        indice === atual
                          ? "w-10 bg-acolhe-600"
                          : "w-4 bg-borda hover:bg-marca-300"
                      }`}
                      style={{ minHeight: "1rem" }}
                    />
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
