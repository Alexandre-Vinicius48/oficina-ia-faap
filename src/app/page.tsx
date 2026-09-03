import Image from "next/image";
import Link from "next/link";
import { Cabecalho, Rodape } from "@/components/Marca";
import { Carrossel } from "@/components/Carrossel";
import { Videos } from "@/components/Videos";
import { Icone, type NomeIcone } from "@/components/Icones";
import { LogosParceria, SeloParceria } from "@/components/Logos";
import { OFICINA } from "@/config/oficina";

/** Divisor curvo suave entre duas faixas de cor. */
function Curva({ de, para }: { de: string; para: string }) {
  return (
    <div aria-hidden="true" className={de}>
      <svg
        viewBox="0 0 1440 48"
        preserveAspectRatio="none"
        className="divisor-curva"
      >
        <path
          d="M0 48h1440V0c-240 32-520 44-720 44S240 32 0 0v48Z"
          className={para}
          fill="currentColor"
        />
      </svg>
    </div>
  );
}

export default function PaginaInicial() {
  const { encontro } = OFICINA;
  const temEncontro = Boolean(encontro.data || encontro.horario || encontro.local);

  return (
    <>
      <Cabecalho />

      <main id="conteudo" className="flex-1">
        {/* =================== 1. HERO =================== */}
        <section className="relative overflow-hidden bg-gradient-to-b from-marca-50 via-papel to-papel">
          <div
            aria-hidden="true"
            className="textura-pontos absolute inset-0 opacity-40"
          />

          <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-5 py-14 lg:grid-cols-[1.05fr_1fr] lg:py-20">
            <div className="animacao-surgir">
              <p className="mb-5 inline-flex items-center gap-2 rounded-full border-2 border-marca-200 bg-white px-5 py-2 text-[0.92rem] font-bold tracking-[0.1em] text-marca-700 uppercase">
                <span className="h-2.5 w-2.5 rounded-full bg-acolhe-600" />
                Inscrições abertas · Gratuito
              </p>

              <h1 className="text-[2.3rem] leading-[1.08] font-extrabold text-marca-900 sm:text-[3.1rem]">
                Oficina de Inteligência Artificial
              </h1>

              <p className="mt-6 text-[1.3rem] leading-relaxed font-bold text-tinta sm:text-[1.5rem]">
                {OFICINA.chamada}
              </p>

              <p className="mt-5 max-w-xl text-[1.1rem] leading-relaxed text-tinta-suave">
                {OFICINA.descricao}
              </p>

              <div className="mt-9 flex flex-col gap-4 sm:flex-row sm:items-center">
                <Link
                  href="/inscricao"
                  className="inline-flex items-center justify-center gap-3 rounded-2xl bg-acolhe-600 px-8 py-5 text-[1.25rem] font-extrabold text-white shadow-lg transition hover:bg-acolhe-700"
                >
                  Quero me inscrever
                  <Icone nome="seta" className="h-7 w-7" />
                </Link>
                <p className="text-[1.02rem] text-tinta-suave">
                  Leva menos de 2 minutos.
                </p>
              </div>

              <div className="mt-10 border-t-2 border-borda pt-7">
                <p className="mb-4 text-[0.88rem] font-bold tracking-[0.14em] text-tinta-suave uppercase">
                  {OFICINA.parceria.selo}
                </p>
                <LogosParceria alturaPx={44} />
              </div>
            </div>

            {/* Foto principal */}
            <div className="animacao-surgir atraso-2 relative">
              <div className="relative aspect-[4/3] overflow-hidden rounded-3xl border-4 border-white shadow-2xl">
                <Image
                  src="/fotos/apoio-individual.jpg"
                  alt="Aluna da FAAP ajudando duas senhoras a usarem um tablet durante a oficina."
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  priority
                  className="object-cover"
                />
              </div>

              <SeloParceria className="absolute -bottom-8 left-1/2 hidden -translate-x-1/2 lg:inline-flex" />
            </div>
          </div>
        </section>

        <Curva de="text-papel-alt bg-papel" para="text-papel-alt" />

        {/* =================== 2. CARROSSEL =================== */}
        <section className="bg-papel-alt pt-6 pb-16 lg:pt-16">
          <div className="mx-auto max-w-6xl px-5">
            <header className="mb-9 max-w-2xl">
              <p className="text-[0.9rem] font-bold tracking-[0.14em] text-acolhe-700 uppercase">
                Como será a oficina
              </p>
              <h2 className="mt-3 text-[1.9rem] leading-tight font-extrabold text-marca-900 sm:text-[2.3rem]">
                Aprender junto, com calma e com gente por perto
              </h2>
            </header>

            <Carrossel />
          </div>
        </section>

        {/* =================== 3. SOBRE A OFICINA =================== */}
        <section className="bg-white py-16 lg:py-20">
          <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 lg:grid-cols-2">
            <div className="relative aspect-[4/3] overflow-hidden rounded-3xl border-4 border-papel-alt shadow-xl">
              <Image
                src="/fotos/acolhimento.jpg"
                alt="Aluna da FAAP mostrando o celular para um senhor e uma senhora, todos sorrindo."
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
            </div>

            <div>
              <p className="text-[0.9rem] font-bold tracking-[0.14em] text-acolhe-700 uppercase">
                Sobre a oficina
              </p>
              <h2 className="mt-3 text-[1.9rem] leading-tight font-extrabold text-marca-900 sm:text-[2.3rem]">
                {OFICINA.parceria.lema}
              </h2>
              <p className="mt-5 text-[1.12rem] leading-relaxed text-tinta-suave">
                Alunos da FAAP se juntaram ao Bairro com Vida para mostrar, na
                prática, como a Inteligência Artificial pode ajudar no dia a
                dia — escrever uma mensagem, criar uma imagem, montar um vídeo
                ou simplesmente tirar uma dúvida.
              </p>

              <ul className="mt-8 space-y-5">
                {[
                  {
                    icone: "pessoas" as const,
                    titulo: "Para quem nunca usou",
                    texto:
                      "Não é preciso saber nada de tecnologia. Começamos do começo.",
                  },
                  {
                    icone: "conversa" as const,
                    titulo: "Sem palavras difíceis",
                    texto:
                      "Tudo explicado com exemplos do cotidiano e no seu ritmo.",
                  },
                  {
                    icone: "escudo" as const,
                    titulo: "Com segurança",
                    texto:
                      "Você também aprende a reconhecer golpes e notícias falsas.",
                  },
                ].map((item) => (
                  <li key={item.titulo} className="flex gap-4">
                    <span className="mt-0.5 flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-marca-50 text-marca-600">
                      <Icone nome={item.icone} className="h-7 w-7" />
                    </span>
                    <span>
                      <strong className="block text-[1.12rem] font-extrabold text-tinta">
                        {item.titulo}
                      </strong>
                      <span className="text-[1.05rem] leading-relaxed text-tinta-suave">
                        {item.texto}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* =================== 4. O QUE VOCÊ VAI APRENDER =================== */}
        <section className="bg-papel-alt py-16 lg:py-20">
          <div className="mx-auto max-w-6xl px-5">
            <header className="mx-auto max-w-2xl text-center">
              <p className="text-[0.9rem] font-bold tracking-[0.14em] text-acolhe-700 uppercase">
                Conteúdo
              </p>
              <h2 className="mt-3 text-[1.9rem] leading-tight font-extrabold text-marca-900 sm:text-[2.3rem]">
                O que você vai aprender
              </h2>
              <p className="mt-4 text-[1.1rem] text-tinta-suave">
                Sete assuntos, todos com exemplos práticos e tempo para
                perguntar.
              </p>
            </header>

            <ul className="mt-11 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {OFICINA.temas.map((tema, indice) => (
                <li
                  key={tema.titulo}
                  className="group rounded-3xl border-2 border-borda bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:border-marca-300 hover:shadow-lg"
                >
                  <span
                    className="mb-5 inline-flex h-16 w-16 items-center justify-center rounded-2xl text-white"
                    style={{
                      backgroundColor: [
                        "var(--color-marca-600)",
                        "var(--color-vida-verde)",
                        "var(--color-vida-roxo)",
                        "var(--color-vida-azul)",
                        "var(--color-vida-laranja)",
                        "var(--color-marca-500)",
                        "var(--color-acolhe-600)",
                      ][indice % 7],
                    }}
                  >
                    <Icone nome={tema.icone as NomeIcone} className="h-8 w-8" />
                  </span>
                  <h3 className="text-[1.22rem] font-extrabold text-tinta">
                    {tema.titulo}
                  </h3>
                  <p className="mt-2 text-[1.05rem] leading-relaxed text-tinta-suave">
                    {tema.texto}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* =================== 5. COMO FUNCIONA A MATRÍCULA =================== */}
        <section className="bg-white py-16 lg:py-20">
          <div className="mx-auto max-w-6xl px-5">
            <header className="mx-auto max-w-2xl text-center">
              <p className="text-[0.9rem] font-bold tracking-[0.14em] text-acolhe-700 uppercase">
                Passo a passo
              </p>
              <h2 className="mt-3 text-[1.9rem] leading-tight font-extrabold text-marca-900 sm:text-[2.3rem]">
                Como funciona a matrícula
              </h2>
            </header>

            <ol className="mt-11 grid gap-8 md:grid-cols-3">
              {OFICINA.passos.map((passo, indice) => (
                <li key={passo.titulo} className="relative">
                  <span
                    aria-hidden="true"
                    className="fonte-titulo flex h-16 w-16 items-center justify-center rounded-2xl bg-marca-700 text-[1.7rem] font-extrabold text-white shadow-md"
                  >
                    {indice + 1}
                  </span>
                  <h3 className="mt-5 text-[1.25rem] font-extrabold text-tinta">
                    <span className="sr-only">Passo {indice + 1}: </span>
                    {passo.titulo}
                  </h3>
                  <p className="mt-2 text-[1.06rem] leading-relaxed text-tinta-suave">
                    {passo.texto}
                  </p>
                </li>
              ))}
            </ol>

            {temEncontro && (
              <div className="mt-14 rounded-3xl border-2 border-marca-200 bg-marca-50 p-8">
                <h3 className="flex items-center gap-3 text-[1.35rem] font-extrabold text-marca-900">
                  <Icone nome="calendario" className="h-8 w-8 text-marca-600" />
                  Quando e onde
                </h3>
                <dl className="mt-6 grid gap-6 sm:grid-cols-3">
                  {encontro.data && (
                    <div>
                      <dt className="text-[0.92rem] font-bold tracking-wide text-tinta-suave uppercase">
                        Data
                      </dt>
                      <dd className="mt-1 text-[1.12rem] font-semibold text-tinta">
                        {encontro.data}
                      </dd>
                    </div>
                  )}
                  {encontro.horario && (
                    <div>
                      <dt className="text-[0.92rem] font-bold tracking-wide text-tinta-suave uppercase">
                        Horário
                      </dt>
                      <dd className="mt-1 text-[1.12rem] font-semibold text-tinta">
                        {encontro.horario}
                      </dd>
                    </div>
                  )}
                  {encontro.local && (
                    <div>
                      <dt className="text-[0.92rem] font-bold tracking-wide text-tinta-suave uppercase">
                        Local
                      </dt>
                      <dd className="mt-1 text-[1.12rem] font-semibold text-tinta">
                        {encontro.local}
                      </dd>
                    </div>
                  )}
                </dl>
              </div>
            )}
          </div>
        </section>

        {/* =================== 6. GALERIA =================== */}
        <section className="bg-papel-alt py-16 lg:py-20">
          <div className="mx-auto max-w-6xl px-5">
            <header className="mx-auto max-w-2xl text-center">
              <p className="text-[0.9rem] font-bold tracking-[0.14em] text-acolhe-700 uppercase">
                Galeria
              </p>
              <h2 className="mt-3 text-[1.9rem] leading-tight font-extrabold text-marca-900 sm:text-[2.3rem]">
                Gente aprendendo junto
              </h2>
            </header>

            <ul className="mt-11 grid gap-7 md:grid-cols-3">
              {OFICINA.galeria.map((item) => (
                <li
                  key={item.legenda}
                  className="overflow-hidden rounded-3xl border-2 border-borda bg-white shadow-sm"
                >
                  <div className="relative aspect-[4/3]">
                    <Image
                      src={item.foto}
                      alt={item.alternativo}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover"
                    />
                  </div>
                  <p className="p-6 text-[1.06rem] leading-relaxed font-semibold text-tinta">
                    {item.legenda}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* =================== 7. VÍDEOS =================== */}
        <Videos />

        {/* =================== 8. INSCRIÇÃO =================== */}
        <section className="relative overflow-hidden bg-marca-900 py-16 text-white lg:py-20">
          <div
            aria-hidden="true"
            className="absolute inset-0 opacity-[0.16]"
            style={{
              backgroundImage:
                "radial-gradient(circle at 20% 20%, var(--color-marca-400) 0, transparent 45%), radial-gradient(circle at 85% 70%, var(--color-acolhe-500) 0, transparent 45%)",
            }}
          />

          <div className="relative mx-auto max-w-3xl px-5 text-center">
            <h2 className="text-[2rem] leading-tight font-extrabold sm:text-[2.5rem]">
              Vamos aprender juntos?
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-[1.18rem] leading-relaxed text-marca-100">
              A inscrição é gratuita e leva menos de dois minutos. Guardamos
              seus dados com segurança e usamos apenas para organizar a oficina.
            </p>

            <Link
              href="/inscricao"
              className="mt-10 inline-flex w-full items-center justify-center gap-3 rounded-2xl bg-acolhe-600 px-9 py-5 text-[1.3rem] font-extrabold text-white shadow-xl transition hover:bg-acolhe-700 sm:w-auto"
            >
              Quero me inscrever
              <Icone nome="seta" className="h-7 w-7" />
            </Link>

            {/* Centralizado por texto, e nao por flex: um cartao que e item
                flex e encolhido pelo navegador abaixo do proprio conteudo. */}
            <div className="mt-12 text-center">
              <div className="inline-flex rounded-2xl bg-white px-8 py-6">
                <LogosParceria alturaPx={40} className="justify-center" />
              </div>
            </div>
          </div>
        </section>
      </main>

      <Rodape />
    </>
  );
}
