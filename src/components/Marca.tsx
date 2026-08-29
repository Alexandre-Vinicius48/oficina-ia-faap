import Link from "next/link";
import { LogoBairro, LogoFaap, LogosParceria } from "@/components/Logos";
import { OFICINA } from "@/config/oficina";

/**
 * Cabecalho institucional.
 * Os dois logos ficam a esquerda, como assinatura da parceria; a direita,
 * um botao direto para a inscricao. Uma linha so, sem menu — menos escolhas,
 * menos chance de a pessoa se perder.
 */
export function Cabecalho({ comBotao = true }: { comBotao?: boolean }) {
  return (
    <header className="sticky top-0 z-40 border-b-2 border-borda bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-4">
        <Link
          href="/"
          className="flex items-center gap-4 rounded-2xl no-underline sm:gap-5"
          aria-label="Página inicial da Oficina de Inteligência Artificial"
        >
          <LogoFaap alturaPx={38} />
          <span aria-hidden="true" className="h-9 w-px bg-borda" />
          <LogoBairro alturaPx={38} />
        </Link>

        {comBotao && (
          <Link
            href="/inscricao"
            className="hidden rounded-xl bg-marca-700 px-6 py-3 text-[1.02rem] font-bold text-white transition hover:bg-marca-800 sm:inline-flex"
          >
            Quero me inscrever
          </Link>
        )}
      </div>
    </header>
  );
}

/** Rodape institucional, com os logos e os avisos de dados. */
export function Rodape() {
  const { contato } = OFICINA;

  return (
    <footer className="mt-auto border-t-2 border-borda bg-white">
      <div className="mx-auto max-w-6xl px-5 py-12">
        <div className="grid gap-10 md:grid-cols-[1.2fr_1fr]">
          <div>
            <LogosParceria alturaPx={42} />
            <p className="mt-5 max-w-md text-[1.05rem] leading-relaxed text-tinta-suave">
              {OFICINA.parceria.lema} Uma iniciativa de alunos da FAAP em
              parceria com o Bairro com Vida para aproximar pessoas idosas das
              novas tecnologias.
            </p>
          </div>

          <div className="space-y-4 text-[1.05rem]">
            {(contato.email || contato.whatsapp) && (
              <div>
                <h2 className="text-[1.05rem] font-extrabold text-tinta">
                  Ficou com dúvida?
                </h2>
                <p className="mt-1 text-tinta-suave">
                  {contato.email && (
                    <a
                      className="font-semibold text-marca-700 underline underline-offset-4"
                      href={`mailto:${contato.email}`}
                    >
                      {contato.email}
                    </a>
                  )}
                  {contato.email && contato.whatsapp && <br />}
                  {contato.whatsapp && (
                    <span className="font-semibold">{contato.whatsapp}</span>
                  )}
                </p>
              </div>
            )}

            <div>
              <h2 className="text-[1.05rem] font-extrabold text-tinta">
                Seus dados
              </h2>
              <p className="mt-1 text-tinta-suave">
                São usados somente para organizar esta oficina.{" "}
                <Link
                  href="/privacidade"
                  className="font-semibold text-marca-700 underline underline-offset-4"
                >
                  Como utilizaremos seus dados
                </Link>
                .
              </p>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-borda pt-6 text-[0.95rem] text-tinta-suave">
          <p>Projeto acadêmico — {OFICINA.subtitulo}.</p>
          <Link
            href="/admin"
            className="font-semibold text-tinta-suave underline underline-offset-4 hover:text-marca-700"
          >
            Área dos responsáveis
          </Link>
        </div>
      </div>
    </footer>
  );
}
