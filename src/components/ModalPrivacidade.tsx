"use client";

import { useEffect, useRef } from "react";
import { TextoPrivacidade } from "@/components/TextoPrivacidade";

/**
 * Janela explicativa da LGPD.
 * Usa <dialog> nativo: ja vem com fechar no Esc, foco preso dentro da janela
 * e leitura correta por leitores de tela.
 */
export function ModalPrivacidade({
  aberto,
  aoFechar,
}: {
  aberto: boolean;
  aoFechar: () => void;
}) {
  const dialogo = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const elemento = dialogo.current;
    if (!elemento) return;
    if (aberto && !elemento.open) elemento.showModal();
    if (!aberto && elemento.open) elemento.close();
  }, [aberto]);

  return (
    <dialog
      ref={dialogo}
      onClose={aoFechar}
      aria-labelledby="titulo-privacidade"
      className="m-auto w-[min(46rem,92vw)] rounded-2xl border-2 border-borda bg-papel p-0 text-tinta backdrop:bg-black/55"
    >
      <div className="max-h-[85dvh] overflow-y-auto p-6 sm:p-8">
        <h2
          id="titulo-privacidade"
          className="text-[1.5rem] font-extrabold text-marca-900"
        >
          Como utilizaremos seus dados
        </h2>

        <div className="mt-6">
          <TextoPrivacidade />
        </div>

        <button
          type="button"
          onClick={aoFechar}
          className="mt-8 w-full rounded-2xl bg-marca-700 px-8 py-4 text-[1.2rem] font-extrabold text-white transition hover:bg-marca-900"
        >
          Entendi, fechar
        </button>
      </div>
    </dialog>
  );
}
