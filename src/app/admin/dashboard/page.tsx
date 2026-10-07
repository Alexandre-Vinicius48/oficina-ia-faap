import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { administradorAtual } from "@/lib/auth";
import { PainelInscritos } from "@/components/PainelInscritos";
import { PainelAulas } from "@/components/PainelAulas";
import { PainelPesquisa } from "@/components/PainelPesquisa";
import { ControleDeInscricoes } from "@/components/ControleDeInscricoes";
import { Icone } from "@/components/Icones";
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
          <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
            <h1 className="text-[1.8rem] font-extrabold text-marca-900">
              Painel de inscritos
            </h1>

            {/* O dashboard fica em outra pagina, e nao mais um bloco aqui
                embaixo: esta tela serve para AGIR (abrir avaliacao, liberar
                questionario, apagar resposta) e a outra para OLHAR. Juntar
                as duas faria uma pagina longa demais para achar um botao. */}
            <Link
              href="/admin/dashboard/resultados"
              className="flex items-center gap-3 rounded-2xl bg-marca-700 px-6 py-4 text-[1.05rem] font-extrabold text-white transition hover:bg-marca-800"
            >
              <Icone nome="grafico" className="h-6 w-6" />
              DASHBOARD
            </Link>
          </div>

          <ControleDeInscricoes />

          <div className="my-12 border-t-2 border-borda" />

          <PainelAulas />

          <div className="my-12 border-t-2 border-borda" />

          <PainelPesquisa />

          <div className="my-12 border-t-2 border-borda" />

          <PainelInscritos nomeAdmin={admin.nome ?? admin.email} />
        </div>
      </main>
    </>
  );
}
