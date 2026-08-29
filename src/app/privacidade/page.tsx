import type { Metadata } from "next";
import Link from "next/link";
import { Cabecalho, Rodape } from "@/components/Marca";
import { TextoPrivacidade } from "@/components/TextoPrivacidade";

export const metadata: Metadata = { title: "Como utilizaremos seus dados" };

export default function PaginaPrivacidade() {
  return (
    <>
      <Cabecalho />
      <main id="conteudo" className="flex-1">
        <div className="mx-auto max-w-3xl px-5 py-12">
          <h1 className="text-[1.9rem] font-extrabold text-marca-900 sm:text-[2.2rem]">
            Como utilizaremos seus dados
          </h1>
          <div className="mt-8">
            <TextoPrivacidade />
          </div>
          <Link
            href="/inscricao"
            className="mt-10 inline-flex w-full items-center justify-center rounded-2xl bg-marca-700 px-8 py-5 text-[1.2rem] font-extrabold text-white sm:w-auto"
          >
            Voltar para a inscrição
          </Link>
        </div>
      </main>
      <Rodape />
    </>
  );
}
