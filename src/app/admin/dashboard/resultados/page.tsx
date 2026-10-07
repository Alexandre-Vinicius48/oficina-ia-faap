import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { administradorAtual } from "@/lib/auth";
import { Dashboard } from "@/components/Dashboard";
import { Icone } from "@/components/Icones";
import { LogosParceria } from "@/components/Logos";
import { dadosDoDashboard } from "@/lib/consulta-dashboard";

export const metadata: Metadata = {
  title: "Dashboard",
  robots: { index: false, follow: false, nocache: true },
};

export const dynamic = "force-dynamic";

/**
 * Os numeros sao calculados no servidor e chegam prontos na tela: nenhuma
 * resposta individual trafega para o navegador alem do que ja aparece
 * escrito no dashboard. Como todas as paginas do projeto, esta so monta
 * depois de confirmar que quem pediu e administrador.
 */
export default async function PaginaResultados() {
  const admin = await administradorAtual();
  if (!admin) redirect("/admin");

  const dados = await dadosDoDashboard();

  return (
    <>
      <header className="border-b-2 border-borda bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-4">
          <LogosParceria alturaPx={36} />
          <p className="text-[0.9rem] font-bold tracking-[0.12em] text-tinta-suave uppercase">
            Painel da oficina
          </p>
        </div>
      </header>

      <main id="conteudo" className="flex-1">
        <div className="mx-auto max-w-6xl px-5 py-10">
          <Link
            href="/admin/dashboard"
            className="inline-flex items-center gap-2 text-[1.05rem] font-bold text-marca-700 underline underline-offset-4"
          >
            <Icone nome="seta" className="h-5 w-5 rotate-180" />
            Voltar para o painel
          </Link>

          <h1 className="mt-6 text-[1.8rem] font-extrabold text-marca-900">
            Dashboard da oficina
          </h1>
          <p className="mt-2 mb-8 max-w-2xl text-[1.1rem] leading-relaxed text-tinta-suave">
            Os dois conjuntos de dados juntos e cada um separado: a avaliação
            de cada aula e o questionário final sobre os quatro encontros.
          </p>

          <Dashboard dados={dados} />
        </div>
      </main>
    </>
  );
}
