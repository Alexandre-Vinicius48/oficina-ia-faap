import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { administradorAtual } from "@/lib/auth";
import { PainelInscritos } from "@/components/PainelInscritos";
import { LogosParceria } from "@/components/Logos";

export const metadata: Metadata = {
  title: "Painel de inscritos",
  robots: { index: false, follow: false, nocache: true },
};

export const dynamic = "force-dynamic";

export default async function PaginaDashboard() {
  // Segunda barreira (a primeira e o middleware): sem administrador validado
  // no servidor, esta pagina nem chega a ser montada.
  const admin = await administradorAtual();
  if (!admin) redirect("/admin");

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
          <h1 className="mb-8 text-[1.8rem] font-extrabold text-marca-900">
            Painel de inscritos
          </h1>
          <PainelInscritos nomeAdmin={admin.nome ?? admin.email} />
        </div>
      </main>
    </>
  );
}
