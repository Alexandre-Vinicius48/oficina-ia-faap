import type { Metadata } from "next";
import { Cabecalho, Rodape } from "@/components/Marca";
import { FormularioInscricao } from "@/components/FormularioInscricao";
import { Icone } from "@/components/Icones";

export const metadata: Metadata = { title: "Inscrição" };

export default function PaginaInscricao() {
  return (
    <>
      <Cabecalho />

      <main id="conteudo" className="flex-1">
        <div className="mx-auto max-w-2xl px-5 py-10 sm:py-14">
          <div className="animacao-surgir">
            <h1 className="text-[1.9rem] leading-tight font-extrabold text-marca-900 sm:text-[2.3rem]">
              Faça sua inscrição
            </h1>
            <p className="mt-4 text-[1.15rem] leading-relaxed text-tinta-suave">
              Preencha os campos abaixo. É rápido, gratuito e leva menos de
              2 minutos.
            </p>

            <div className="mt-6 flex items-start gap-3 rounded-2xl border-2 border-marca-200 bg-white p-5">
              <span className="mt-1 shrink-0 text-marca-600">
                <Icone nome="cadeado" className="h-7 w-7" />
              </span>
              <p className="text-[1.05rem] leading-relaxed text-tinta">
                Suas informações são guardadas com segurança e usadas somente
                pela organização da oficina.
              </p>
            </div>

            <div className="mt-9 rounded-2xl border-2 border-borda bg-white p-6 shadow-sm sm:p-8">
              <FormularioInscricao />
            </div>
          </div>
        </div>
      </main>

      <Rodape />
    </>
  );
}
