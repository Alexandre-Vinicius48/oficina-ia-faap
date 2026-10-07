import type { Metadata } from "next";
import Image from "next/image";
import { Suspense } from "react";
import { Cabecalho, Rodape } from "@/components/Marca";
import { AreaPesquisa } from "@/components/AreaPesquisa";
import { Icone } from "@/components/Icones";
import { SECOES_PESQUISA, TOTAL_DE_PERGUNTAS } from "@/lib/pesquisa";

export const metadata: Metadata = {
  title: "Questionário final",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * A PESQUISA DE SATISFACAO DOS QUATRO ENCONTROS.
 *
 * Pagina separada da avaliacao de aula de proposito. As duas tem a mesma
 * porta de entrada (celular + codigo projetado na sala), mas respondem a
 * coisas diferentes: a avaliacao e sobre a aula do dia e pode estar aberta
 * em qualquer encontro; esta e sobre a oficina inteira e so e liberada no
 * fim. Misturar as duas na mesma tela obrigaria o participante a entender a
 * diferenca — e um codigo so acabaria valendo para as duas coisas.
 */
export default function PaginaPesquisa() {
  return (
    <>
      <Cabecalho comBotao={false} />

      <main id="conteudo" className="flex-1">
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
                Questionário final
              </h1>
              <p className="mt-4 text-[1.15rem] leading-relaxed text-tinta-suave">
                Pesquisa de satisfação sobre os quatro encontros da oficina.
                São {TOTAL_DE_PERGUNTAS} perguntas de marcar e três para
                escrever, se você quiser.
              </p>
            </div>
          </div>
        </section>

        <div className="mx-auto grid max-w-6xl gap-10 px-5 py-12 lg:grid-cols-[1.25fr_0.75fr] lg:items-start">
          <div className="order-2 lg:order-1">
            <div className="rounded-3xl border-2 border-borda bg-white p-6 shadow-lg sm:p-9">
              <Suspense
                fallback={
                  <p className="text-[1.1rem] text-tinta-suave">Carregando...</p>
                }
              >
                <AreaPesquisa />
              </Suspense>
            </div>
          </div>

          <aside className="order-1 space-y-6 lg:order-2 lg:sticky lg:top-28">
            <div className="rounded-3xl border-2 border-borda bg-white p-6 shadow-sm">
              <h2 className="flex items-center gap-3 text-[1.3rem] font-extrabold text-marca-900">
                <Icone nome="escrita" className="h-7 w-7 text-marca-600" />
                O que vamos perguntar
              </h2>
              <ol className="mt-5 space-y-2">
                {SECOES_PESQUISA.map((secao, i) => (
                  <li
                    key={secao.titulo}
                    className="flex items-start gap-3 text-[1.03rem] leading-snug text-tinta"
                  >
                    <span
                      aria-hidden="true"
                      className="fonte-titulo mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-marca-50 text-[0.9rem] font-extrabold text-marca-800"
                    >
                      {i + 1}
                    </span>
                    {secao.titulo}
                  </li>
                ))}
              </ol>
            </div>

            <div className="flex items-start gap-4 rounded-3xl border-2 border-marca-200 bg-marca-50 p-6">
              <span className="mt-0.5 shrink-0 text-marca-600">
                <Icone nome="cadeado" className="h-7 w-7" />
              </span>
              <p className="text-[1.05rem] leading-relaxed text-tinta">
                Suas respostas vão <strong>com o seu nome</strong> para a
                organização da oficina. O celular serve para conferir que você
                participou e para que cada pessoa responda uma vez só.
              </p>
            </div>
          </aside>
        </div>
      </main>

      <Rodape />
    </>
  );
}
