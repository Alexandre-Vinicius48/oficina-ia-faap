import Link from "next/link";
import { Cabecalho, Rodape } from "@/components/Marca";

export default function PaginaNaoEncontrada() {
  return (
    <>
      <Cabecalho comBotao={false} />
      <main id="conteudo" className="flex-1">
        <div className="mx-auto max-w-2xl px-5 py-20 text-center">
          <h1 className="text-[1.9rem] font-extrabold text-marca-900">
            Página não encontrada
          </h1>
          <p className="mt-4 text-[1.15rem] text-tinta-suave">
            O endereço digitado não existe ou foi alterado.
          </p>
          <Link
            href="/"
            className="mt-9 inline-flex w-full items-center justify-center rounded-2xl bg-marca-700 px-8 py-5 text-[1.2rem] font-extrabold text-white sm:w-auto"
          >
            Ir para a página inicial
          </Link>
        </div>
      </main>
      <Rodape />
    </>
  );
}
