import type { Metadata } from "next";
import Image from "next/image";
import { Cabecalho, Rodape } from "@/components/Marca";
import { FormularioInscricao } from "@/components/FormularioInscricao";
import { Icone } from "@/components/Icones";
import { SeloParceria } from "@/components/Logos";
import { OFICINA } from "@/config/oficina";

export const metadata: Metadata = { title: "Inscrição" };

export default function PaginaInscricao() {
  return (
    <>
      <Cabecalho comBotao={false} />

      <main id="conteudo" className="flex-1">
        {/* Faixa de apresentação */}
        <section className="relative overflow-hidden border-b-2 border-borda bg-gradient-to-b from-marca-50 to-papel">
          <div
            aria-hidden="true"
            className="textura-pontos absolute inset-0 opacity-40"
          />
          <div className="relative mx-auto max-w-6xl px-5 py-10 sm:py-14">
            <div className="animacao-surgir max-w-2xl">
              <p className="mb-4 inline-flex items-center gap-2 rounded-full border-2 border-marca-200 bg-white px-5 py-2 text-[0.9rem] font-bold tracking-[0.1em] text-marca-700 uppercase">
                <span className="h-2.5 w-2.5 rounded-full bg-acolhe-600" />
                Inscrição gratuita
              </p>
              <h1 className="text-[2rem] leading-tight font-extrabold text-marca-900 sm:text-[2.5rem]">
                Faça sua inscrição
              </h1>
              <p className="mt-4 text-[1.15rem] leading-relaxed text-tinta-suave">
                Preencha os campos abaixo. É rápido, gratuito e leva menos de
                2 minutos.
              </p>
            </div>
          </div>
        </section>

        <div className="mx-auto grid max-w-6xl gap-10 px-5 py-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
          {/* ---------- Formulário ---------- */}
          <div className="animacao-surgir order-2 lg:order-1">
            <div className="rounded-3xl border-2 border-borda bg-white p-6 shadow-lg sm:p-9">
              <FormularioInscricao />
            </div>
          </div>

          {/* ---------- Coluna de apoio ---------- */}
          <aside className="animacao-surgir atraso-1 order-1 space-y-6 lg:order-2 lg:sticky lg:top-28">
            <div className="flex items-start gap-4 rounded-3xl border-2 border-marca-200 bg-marca-50 p-6">
              <span className="mt-0.5 shrink-0 text-marca-600">
                <Icone nome="cadeado" className="h-8 w-8" />
              </span>
              <p className="text-[1.06rem] leading-relaxed text-tinta">
                Suas informações são guardadas com segurança e usadas somente
                pela organização da oficina. Ninguém mais vê a sua inscrição.
              </p>
            </div>

            <div className="overflow-hidden rounded-3xl border-2 border-borda bg-white shadow-sm">
              <div className="relative aspect-[4/3]">
                <Image
                  src="/fotos/acolhimento.jpg"
                  alt="Aluna da FAAP mostrando o celular para um senhor e uma senhora durante a oficina."
                  fill
                  sizes="(max-width: 1024px) 100vw, 40vw"
                  className="object-cover"
                />
              </div>
              <p className="p-6 text-[1.06rem] leading-relaxed text-tinta-suave">
                <strong className="font-extrabold text-tinta">
                  Não precisa saber nada de tecnologia.
                </strong>{" "}
                Um aluno da FAAP acompanha você durante toda a oficina.
              </p>
            </div>

            <ol className="rounded-3xl border-2 border-borda bg-white p-6 shadow-sm">
              <p className="mb-5 text-[0.9rem] font-bold tracking-[0.12em] text-tinta-suave uppercase">
                Depois de enviar
              </p>
              {OFICINA.passos.slice(1).map((passo, indice) => (
                <li key={passo.titulo} className="flex gap-4 not-last:mb-5">
                  <span
                    aria-hidden="true"
                    className="fonte-titulo flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-marca-700 text-[1.15rem] font-extrabold text-white"
                  >
                    {indice + 2}
                  </span>
                  <span>
                    <strong className="block text-[1.08rem] font-extrabold text-tinta">
                      {passo.titulo}
                    </strong>
                    <span className="text-[1.02rem] leading-relaxed text-tinta-suave">
                      {passo.texto}
                    </span>
                  </span>
                </li>
              ))}
            </ol>

            <div className="text-center">
              <SeloParceria />
            </div>
          </aside>
        </div>
      </main>

      <Rodape />
    </>
  );
}
