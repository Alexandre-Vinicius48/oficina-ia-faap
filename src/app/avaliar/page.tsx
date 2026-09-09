import type { Metadata } from "next";
import Image from "next/image";
import { Suspense } from "react";
import { Cabecalho, Rodape } from "@/components/Marca";
import { AreaParticipante } from "@/components/AreaParticipante";
import { Icone } from "@/components/Icones";
import { cronograma } from "@/lib/consulta-aulas";

export const metadata: Metadata = {
  title: "Área do Convidado",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/** 2026-10-05 -> "Segunda-feira, 5 de outubro" */
function porExtenso(data: string): string {
  const [ano, mes, dia] = data.split("-").map(Number);
  if (!ano || !mes || !dia) return data;
  const d = new Date(Date.UTC(ano, mes - 1, dia));
  const texto = new Intl.DateTimeFormat("pt-BR", {
    timeZone: "UTC",
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(d);
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

export default async function PaginaAvaliar() {
  const aulas = await cronograma();

  return (
    <>
      <Cabecalho comBotao={false} />

      <main id="conteudo" className="flex-1">
        {/* O banner traz o titulo desenhado. Em tela estreita as letras dentro
            dele ficam pequenas demais para o nosso publico, entao o titulo
            tambem aparece como texto de verdade logo abaixo — grande, e lido
            por leitores de tela. */}
        <section className="border-b-2 border-borda bg-white">
          <div className="mx-auto max-w-6xl px-0 sm:px-5 sm:pt-8">
            <Image
              src="/banners/area-convidado.jpg"
              alt="Área do Convidado — Bairro com Vida. FAAP, Prática Extensionista."
              width={2172}
              height={724}
              priority
              sizes="(max-width: 640px) 100vw, 1152px"
              className="h-auto w-full sm:rounded-3xl"
            />
          </div>

          <div className="mx-auto max-w-6xl px-5 py-8 sm:py-10">
            <div className="max-w-2xl">
              <h1 className="text-[2rem] leading-tight font-extrabold text-marca-900 sm:text-[2.5rem]">
                Avalie a aula de hoje
              </h1>
              <p className="mt-4 text-[1.15rem] leading-relaxed text-tinta-suave">
                Sua opinião ajuda a melhorar os próximos encontros. Leva menos de
                um minuto.
              </p>
            </div>
          </div>
        </section>

        <div className="mx-auto grid max-w-6xl gap-10 px-5 py-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
          <div className="order-2 lg:order-1">
            <div className="rounded-3xl border-2 border-borda bg-white p-6 shadow-lg sm:p-9">
              <Suspense
                fallback={
                  <p className="text-[1.1rem] text-tinta-suave">Carregando...</p>
                }
              >
                <AreaParticipante totalDeAulas={aulas.length || 4} />
              </Suspense>
            </div>
          </div>

          <aside className="order-1 space-y-6 lg:order-2 lg:sticky lg:top-28">
            {aulas.length > 0 && (
              <div className="rounded-3xl border-2 border-borda bg-white p-6 shadow-sm">
                <h2 className="flex items-center gap-3 text-[1.3rem] font-extrabold text-marca-900">
                  <Icone nome="calendario" className="h-7 w-7 text-marca-600" />
                  Cronograma
                </h2>
                <ol className="mt-5 space-y-4">
                  {aulas.map((aula) => (
                    <li
                      key={aula.numero}
                      className={`rounded-2xl border-2 p-4 ${
                        aula.avaliacaoAberta
                          ? "border-acolhe-600 bg-acolhe-50"
                          : "border-borda bg-papel-alt"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <span
                          aria-hidden="true"
                          className="fonte-titulo flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-marca-700 text-[1.05rem] font-extrabold text-white"
                        >
                          {aula.numero}
                        </span>
                        <div>
                          <p className="text-[1.08rem] font-extrabold text-tinta">
                            <span className="sr-only">Aula {aula.numero}: </span>
                            {aula.tema}
                          </p>
                          <p className="mt-0.5 text-[1rem] text-tinta-suave">
                            {porExtenso(aula.data)}
                          </p>
                          {aula.avaliacaoAberta && (
                            <p className="mt-2 text-[0.98rem] font-extrabold text-acolhe-700">
                              Avaliação aberta agora
                            </p>
                          )}
                        </div>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            <div className="flex items-start gap-4 rounded-3xl border-2 border-marca-200 bg-marca-50 p-6">
              <span className="mt-0.5 shrink-0 text-marca-600">
                <Icone nome="cadeado" className="h-7 w-7" />
              </span>
              <p className="text-[1.05rem] leading-relaxed text-tinta">
                Sua avaliação é guardada <strong>sem o seu nome</strong>. Pedimos
                o celular apenas para conferir que você está inscrito e para que
                cada pessoa responda uma vez só.
              </p>
            </div>
          </aside>
        </div>
      </main>

      <Rodape />
    </>
  );
}
