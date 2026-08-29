import Link from "next/link";
import { OFICINA } from "@/config/oficina";

/** Selo circular com as iniciais — funciona como logo simples do projeto. */
export function Selo({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-marca-700 text-[1.15rem] font-extrabold tracking-tight text-white shadow-sm ${className}`}
      aria-hidden="true"
    >
      IA
    </span>
  );
}

export function Cabecalho() {
  return (
    <header className="border-b-2 border-borda bg-white">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-5 py-5">
        <Link
          href="/"
          className="flex items-center gap-4 rounded-2xl text-left no-underline"
        >
          <Selo />
          <span className="flex flex-col leading-tight">
            <span className="text-[1.05rem] font-extrabold text-marca-900 sm:text-[1.2rem]">
              Oficina de Inteligência Artificial
            </span>
            <span className="text-[0.95rem] font-semibold text-tinta-suave">
              {OFICINA.subtitulo}
            </span>
          </span>
        </Link>
      </div>
    </header>
  );
}

export function Rodape() {
  const { contato } = OFICINA;
  return (
    <footer className="mt-auto border-t-2 border-borda bg-white">
      <div className="mx-auto max-w-5xl px-5 py-8 text-[1rem] text-tinta-suave">
        <p className="font-semibold text-tinta">
          Oficina de Inteligência Artificial — {OFICINA.subtitulo}
        </p>
        {(contato.email || contato.whatsapp) && (
          <p className="mt-2">
            Dúvidas?{" "}
            {contato.email && (
              <a
                className="font-semibold text-marca-700 underline underline-offset-4"
                href={`mailto:${contato.email}`}
              >
                {contato.email}
              </a>
            )}
            {contato.email && contato.whatsapp && " · "}
            {contato.whatsapp && <span className="font-semibold">{contato.whatsapp}</span>}
          </p>
        )}
        <p className="mt-4">
          Seus dados são usados somente para organizar esta oficina.{" "}
          <Link
            href="/privacidade"
            className="font-semibold text-marca-700 underline underline-offset-4"
          >
            Como utilizaremos seus dados
          </Link>
          .
        </p>
        <p className="mt-4 text-[0.9rem]">
          Projeto acadêmico dos alunos da FAAP em parceria com o Bairro com Vida.
        </p>
      </div>
    </footer>
  );
}
