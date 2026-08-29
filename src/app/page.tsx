import Link from "next/link";
import { Cabecalho, Rodape } from "@/components/Marca";
import { Icone, type NomeIcone } from "@/components/Icones";
import { OFICINA } from "@/config/oficina";

export default function PaginaInicial() {
  const { encontro } = OFICINA;
  const temEncontro = Boolean(encontro.data || encontro.horario || encontro.local);

  return (
    <>
      <Cabecalho />

      <main id="conteudo" className="flex-1">
        {/* ---------------- Apresentação ---------------- */}
        <section className="border-b-2 border-borda bg-gradient-to-b from-marca-50 to-papel">
          <div className="animacao-surgir mx-auto max-w-3xl px-5 py-14 text-center sm:py-20">
            <p className="mb-4 inline-block rounded-full bg-white px-5 py-2 text-[0.95rem] font-bold tracking-wide text-marca-700 uppercase ring-2 ring-marca-200">
              Inscrições abertas · Gratuito
            </p>

            <h1 className="text-[2.1rem] leading-tight font-extrabold text-marca-900 sm:text-[2.9rem]">
              Oficina de Inteligência Artificial
            </h1>

            <p className="mt-3 text-[1.25rem] font-bold text-acolhe-700 sm:text-[1.4rem]">
              {OFICINA.subtitulo}
            </p>

            <p className="mx-auto mt-7 max-w-2xl text-[1.25rem] leading-relaxed font-semibold text-tinta sm:text-[1.4rem]">
              {OFICINA.chamada}
            </p>

            <p className="mx-auto mt-5 max-w-2xl text-[1.1rem] leading-relaxed text-tinta-suave">
              {OFICINA.descricao}
            </p>

            <div className="mt-10">
              <Link
                href="/inscricao"
                className="inline-flex w-full items-center justify-center gap-3 rounded-2xl bg-acolhe-700 px-8 py-5 text-[1.3rem] font-extrabold text-white shadow-lg transition hover:bg-acolhe-800 sm:w-auto sm:text-[1.4rem]"
              >
                QUERO PARTICIPAR
                <Icone nome="seta" className="h-7 w-7" />
              </Link>
              <p className="mt-4 text-[1rem] text-tinta-suave">
                A inscrição leva menos de 2 minutos.
              </p>
            </div>
          </div>
        </section>

        {/* ---------------- Data / horário / local ---------------- */}
        {temEncontro && (
          <section className="mx-auto max-w-3xl px-5 py-10">
            <div className="rounded-2xl border-2 border-marca-200 bg-white p-7 shadow-sm">
              <h2 className="flex items-center gap-3 text-[1.4rem] font-extrabold text-marca-900">
                <Icone nome="calendario" className="h-8 w-8 text-marca-600" />
                Quando e onde
              </h2>
              <dl className="mt-5 space-y-4 text-[1.15rem]">
                {encontro.data && (
                  <div>
                    <dt className="font-bold text-tinta">Data</dt>
                    <dd className="text-tinta-suave">{encontro.data}</dd>
                  </div>
                )}
                {encontro.horario && (
                  <div>
                    <dt className="font-bold text-tinta">Horário</dt>
                    <dd className="text-tinta-suave">{encontro.horario}</dd>
                  </div>
                )}
                {encontro.local && (
                  <div>
                    <dt className="font-bold text-tinta">Local</dt>
                    <dd className="text-tinta-suave">{encontro.local}</dd>
                  </div>
                )}
              </dl>
            </div>
          </section>
        )}

        {/* ---------------- Temas ---------------- */}
        <section className="mx-auto max-w-5xl px-5 py-14">
          <h2 className="text-center text-[1.7rem] font-extrabold text-marca-900 sm:text-[2rem]">
            O que você vai aprender
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-[1.1rem] text-tinta-suave">
            Tudo explicado com calma, com exemplos do dia a dia e sem palavras
            difíceis.
          </p>

          <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {OFICINA.temas.map((tema) => (
              <li
                key={tema.titulo}
                className="rounded-2xl border-2 border-borda bg-white p-6 shadow-sm"
              >
                <span className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-marca-50 text-marca-600">
                  <Icone nome={tema.icone as NomeIcone} />
                </span>
                <h3 className="text-[1.2rem] font-extrabold text-tinta">
                  {tema.titulo}
                </h3>
                <p className="mt-2 text-[1.05rem] leading-relaxed text-tinta-suave">
                  {tema.texto}
                </p>
              </li>
            ))}
          </ul>
        </section>

        {/* ---------------- Para quem é ---------------- */}
        <section className="border-y-2 border-borda bg-white">
          <div className="mx-auto grid max-w-4xl gap-8 px-5 py-14 sm:grid-cols-2">
            <div>
              <span className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-acolhe-50 text-acolhe-700">
                <Icone nome="pessoas" />
              </span>
              <h2 className="text-[1.4rem] font-extrabold text-marca-900">
                Para quem é a oficina
              </h2>
              <p className="mt-3 text-[1.1rem] leading-relaxed text-tinta-suave">
                Para qualquer pessoa que queira aprender, mesmo quem nunca usou
                Inteligência Artificial. Não é preciso saber nada de tecnologia.
              </p>
            </div>
            <div>
              <span className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-acolhe-50 text-acolhe-700">
                <Icone nome="escudo" />
              </span>
              <h2 className="text-[1.4rem] font-extrabold text-marca-900">
                Seus dados ficam protegidos
              </h2>
              <p className="mt-3 text-[1.1rem] leading-relaxed text-tinta-suave">
                Os dados da inscrição são usados apenas pela organização da
                oficina. Ninguém mais vê a sua inscrição.{" "}
                <Link
                  href="/privacidade"
                  className="font-semibold text-marca-700 underline underline-offset-4"
                >
                  Saiba como cuidamos deles
                </Link>
                .
              </p>
            </div>
          </div>
        </section>

        {/* ---------------- Chamada final ---------------- */}
        <section className="mx-auto max-w-3xl px-5 py-16 text-center">
          <h2 className="text-[1.7rem] font-extrabold text-marca-900 sm:text-[2rem]">
            Vamos aprender juntos?
          </h2>
          <p className="mt-3 text-[1.15rem] text-tinta-suave">
            Faça sua inscrição agora. É rápido e gratuito.
          </p>
          <Link
            href="/inscricao"
            className="mt-8 inline-flex w-full items-center justify-center gap-3 rounded-2xl bg-acolhe-700 px-8 py-5 text-[1.3rem] font-extrabold text-white shadow-lg transition hover:bg-acolhe-800 sm:w-auto"
          >
            QUERO PARTICIPAR
            <Icone nome="seta" className="h-7 w-7" />
          </Link>
        </section>
      </main>

      <Rodape />
    </>
  );
}
