"use client";

import { useEffect, useRef } from "react";
import { Icone } from "@/components/Icones";

/**
 * Janela de confirmacao para acoes que nao tem volta.
 *
 * Usa o <dialog> nativo: ja vem com fechar no Esc, foco preso dentro da
 * janela e leitura correta por leitores de tela. O botao perigoso NAO recebe
 * o foco inicial de proposito — quem abriu precisa mirar nele para confirmar,
 * o que evita apagar algo com um Enter distraido.
 */
export function DialogoConfirmacao({
  aberto,
  titulo,
  descricao,
  detalhe,
  textoConfirmar,
  processando = false,
  aoConfirmar,
  aoCancelar,
}: {
  aberto: boolean;
  titulo: string;
  descricao: string;
  detalhe?: string;
  textoConfirmar: string;
  processando?: boolean;
  aoConfirmar: () => void;
  aoCancelar: () => void;
}) {
  const dialogo = useRef<HTMLDialogElement>(null);
  const botaoCancelar = useRef<HTMLButtonElement>(null);

  // Sem lista de dependencias de proposito: o efeito roda a cada render e
  // reconcilia o <dialog> real com o estado. Se os dois saissem de sincronia
  // por qualquer motivo, um efeito preso a [aberto] nunca mais dispararia e a
  // janela ficaria impossivel de reabrir. E barato, e este trecho e pequeno.
  useEffect(() => {
    const elemento = dialogo.current;
    if (!elemento) return;

    if (aberto && !elemento.open) {
      elemento.showModal();
      // O foco comeca no "Cancelar", que e a saida segura.
      botaoCancelar.current?.focus();
    }
    if (!aberto && elemento.open) elemento.close();
  });

  return (
    <dialog
      ref={dialogo}
      onClose={aoCancelar}
      onCancel={(evento) => {
        // Nao deixa fechar com Esc no meio da exclusao.
        if (processando) evento.preventDefault();
      }}
      aria-labelledby="titulo-confirmacao"
      aria-describedby="descricao-confirmacao"
      className="m-auto w-[min(34rem,92vw)] rounded-2xl border-2 border-borda bg-papel p-0 text-tinta backdrop:bg-black/55"
    >
      <div className="p-6 sm:p-8">
        <div className="flex items-start gap-4">
          <span className="mt-1 flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-erro-50 text-erro-700">
            <Icone nome="alerta" className="h-8 w-8" />
          </span>
          <div>
            <h2
              id="titulo-confirmacao"
              className="text-[1.4rem] leading-tight font-extrabold text-tinta"
            >
              {titulo}
            </h2>
            <p
              id="descricao-confirmacao"
              className="mt-3 text-[1.08rem] leading-relaxed text-tinta-suave"
            >
              {descricao}
            </p>
          </div>
        </div>

        {detalhe && (
          <p className="mt-5 rounded-xl border-2 border-borda bg-white p-4 text-[1.08rem] font-bold break-words text-tinta">
            {detalhe}
          </p>
        )}

        <div className="mt-8 flex flex-col gap-3 sm:flex-row-reverse">
          <button
            type="button"
            onClick={aoConfirmar}
            disabled={processando}
            aria-busy={processando}
            className="flex flex-1 items-center justify-center gap-3 rounded-2xl bg-erro-600 px-6 py-4 text-[1.12rem] font-extrabold text-white transition hover:bg-erro-700 disabled:cursor-not-allowed disabled:bg-tinta-suave"
          >
            {processando ? (
              <>
                <span
                  className="h-6 w-6 animate-spin rounded-full border-4 border-white/40 border-t-white"
                  aria-hidden="true"
                />
                Excluindo...
              </>
            ) : (
              textoConfirmar
            )}
          </button>

          <button
            ref={botaoCancelar}
            type="button"
            onClick={aoCancelar}
            disabled={processando}
            className="flex-1 rounded-2xl border-2 border-borda bg-white px-6 py-4 text-[1.12rem] font-extrabold text-tinta transition hover:bg-papel disabled:cursor-not-allowed"
          >
            Cancelar
          </button>
        </div>
      </div>
    </dialog>
  );
}
