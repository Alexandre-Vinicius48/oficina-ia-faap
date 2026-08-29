"use client";

import { forwardRef } from "react";

type Props = {
  id: string;
  rotulo: string;
  ajuda?: string;
  erro?: string;
  obrigatorio?: boolean;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "id">;

/**
 * Campo de formulario acessivel.
 *  - <label> sempre ligado ao input pelo id (a pessoa pode tocar no rotulo);
 *  - erro anunciado por leitores de tela (aria-describedby + role="alert");
 *  - borda vermelha grossa quando ha erro, alem do texto - nunca so a cor.
 */
export const Campo = forwardRef<HTMLInputElement, Props>(function Campo(
  { id, rotulo, ajuda, erro, obrigatorio = true, className = "", ...resto },
  ref,
) {
  const idAjuda = ajuda ? `${id}-ajuda` : undefined;
  const idErro = erro ? `${id}-erro` : undefined;
  const descrito = [idAjuda, idErro].filter(Boolean).join(" ") || undefined;

  return (
    <div className="space-y-2">
      <label
        htmlFor={id}
        className="block text-[1.15rem] font-extrabold text-tinta"
      >
        {rotulo}
        {obrigatorio && (
          <span className="ml-1 text-erro-600" aria-hidden="true">
            *
          </span>
        )}
        {obrigatorio && <span className="sr-only"> (obrigatório)</span>}
      </label>

      {ajuda && (
        <p id={idAjuda} className="text-[1rem] text-tinta-suave">
          {ajuda}
        </p>
      )}

      <input
        ref={ref}
        id={id}
        aria-required={obrigatorio}
        aria-invalid={erro ? true : undefined}
        aria-describedby={descrito}
        className={`w-full rounded-xl border-2 bg-white px-4 py-4 text-[1.2rem] text-tinta placeholder:text-tinta-suave/70 ${
          erro ? "border-erro-600 bg-erro-50" : "border-borda"
        } ${className}`}
        {...resto}
      />

      {erro && (
        <p
          id={idErro}
          role="alert"
          className="flex items-start gap-2 text-[1.05rem] font-bold text-erro-700"
        >
          <span aria-hidden="true">⚠</span>
          {erro}
        </p>
      )}
    </div>
  );
});
