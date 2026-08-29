import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { administradorAtual } from "@/lib/auth";
import { FormularioLogin } from "@/components/FormularioLogin";
import { Icone } from "@/components/Icones";
import { Selo } from "@/components/Marca";
import { OFICINA } from "@/config/oficina";

export const metadata: Metadata = {
  title: "Área administrativa",
  robots: { index: false, follow: false, nocache: true },
};

export const dynamic = "force-dynamic";

export default async function PaginaLoginAdmin() {
  // Quem ja e administrador vai direto para o painel.
  if (await administradorAtual()) {
    redirect("/admin/dashboard");
  }

  return (
    <main
      id="conteudo"
      className="flex min-h-dvh flex-1 items-center justify-center px-5 py-12"
    >
      <div className="animacao-surgir w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <Selo className="mb-4" />
          <h1 className="text-[1.7rem] font-extrabold text-marca-900">
            Área administrativa
          </h1>
          <p className="mt-2 text-[1.05rem] font-semibold text-tinta-suave">
            {OFICINA.subtitulo}
          </p>
        </div>

        <div className="rounded-2xl border-2 border-borda bg-white p-6 shadow-sm sm:p-8">
          <p className="mb-6 flex items-start gap-3 rounded-xl bg-marca-50 p-4 text-[1rem] text-tinta">
            <span className="mt-0.5 shrink-0 text-marca-600">
              <Icone nome="cadeado" className="h-6 w-6" />
            </span>
            Esta área é somente para os responsáveis pela oficina.
          </p>

          <FormularioLogin />
        </div>

        <Link
          href="/"
          className="mt-8 block text-center text-[1.05rem] font-bold text-marca-700 underline underline-offset-4"
        >
          Voltar para a página da oficina
        </Link>
      </div>
    </main>
  );
}
