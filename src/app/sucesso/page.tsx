import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { Cabecalho, Rodape } from "@/components/Marca";
import { SeloParceria } from "@/components/Logos";
import { Icone } from "@/components/Icones";
import { OFICINA } from "@/config/oficina";

export const metadata: Metadata = {
  title: "Matrícula realizada",
  robots: { index: false, follow: false },
};

/**
 * Esta tela NAO mostra nenhum dado pessoal - nem nome, nem CPF, nem RG.
 * O cookie usado aqui guarda apenas a marca "ok", nada mais.
 */
export default async function PaginaSucesso() {
  const armazem = await cookies();
  const veioDoFormulario = armazem.get("matricula_ok")?.value === "1";

  return (
    <>
      <Cabecalho comBotao={false} />

      <main id="conteudo" className="flex-1">
        <div className="animacao-surgir mx-auto max-w-2xl px-5 py-14 text-center sm:py-20">
          <span className="mx-auto mb-7 flex h-24 w-24 items-center justify-center rounded-full bg-sucesso-50 text-sucesso-700">
            <Icone nome="check" className="h-14 w-14" />
          </span>

          <h1 className="text-[2rem] leading-tight font-extrabold text-sucesso-700 sm:text-[2.5rem]">
            Matrícula realizada com sucesso!
          </h1>

          <p className="mt-6 text-[1.2rem] leading-relaxed font-semibold text-tinta">
            Obrigado por participar da Oficina de Inteligência Artificial —{" "}
            {OFICINA.subtitulo}.
          </p>

          <div className="mt-8 rounded-2xl border-2 border-marca-200 bg-white p-6 text-left shadow-sm">
            <p className="text-[1.15rem] leading-relaxed text-tinta">
              <strong className="font-extrabold">
                Em breve entraremos em contato com mais informações.
              </strong>{" "}
              {OFICINA.encontro.observacao}
            </p>
          </div>

          {!veioDoFormulario && (
            <p className="mt-8 text-[1.05rem] text-tinta-suave">
              Ainda não fez sua inscrição?{" "}
              <Link
                href="/inscricao"
                className="font-bold text-marca-700 underline underline-offset-4"
              >
                Inscreva-se aqui
              </Link>
              .
            </p>
          )}

          <Link
            href="/"
            className="mt-10 inline-flex w-full items-center justify-center rounded-2xl bg-marca-700 px-8 py-5 text-[1.2rem] font-extrabold text-white transition hover:bg-marca-800 sm:w-auto"
          >
            Voltar para a página inicial
          </Link>

          <div className="mt-14 text-center">
            <SeloParceria />
          </div>
        </div>
      </main>

      <Rodape />
    </>
  );
}
