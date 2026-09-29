"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Icone } from "@/components/Icones";
import { DialogoConfirmacao } from "@/components/DialogoConfirmacao";

/**
 * Liga e desliga o formulario de inscricao do site.
 *
 * Os dois sentidos pedem confirmacao, e nao so o fechar. Abrir por engano
 * tambem e visivel para o publico — e no caso de uma oficina com vagas
 * limitadas, pode trazer gente que depois vai precisar ser recusada.
 */
export function ControleDeInscricoes() {
  const router = useRouter();

  const [abertas, setAbertas] = useState<boolean | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [confirmando, setConfirmando] = useState<"abrir" | "fechar" | null>(null);

  async function chamar(acao: "ler" | "abrir" | "fechar") {
    const resposta = await fetch("/api/admin/configuracoes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
      body: JSON.stringify({ acao }),
    });
    if (resposta.status === 401 || resposta.status === 403) {
      router.replace("/admin");
      return null;
    }
    if (!resposta.ok) {
      const c = await resposta.json().catch(() => ({}));
      setErro(c.erro ?? "Não foi possível concluir a ação.");
      return null;
    }
    return resposta.json();
  }

  // Todo setState acontece depois do await: mudar estado de forma sincrona
  // dentro de um efeito dispara renderizacoes em cascata.
  useEffect(() => {
    let cancelado = false;
    (async () => {
      const dados = await chamar("ler");
      if (cancelado || !dados) return;
      setAbertas(dados.inscricoesAbertas);
    })();
    return () => {
      cancelado = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function aplicar() {
    if (!confirmando || ocupado) return;
    setOcupado(true);
    setErro(null);
    const dados = await chamar(confirmando);
    if (dados) setAbertas(dados.inscricoesAbertas);
    setConfirmando(null);
    setOcupado(false);
    // A pagina inicial e a de inscricao sao geradas no servidor: precisam
    // ser refeitas para refletir o novo estado.
    router.refresh();
  }

  if (abertas === null) {
    return (
      <section className="rounded-3xl border-2 border-borda bg-white p-6 shadow-sm">
        <p className="text-[1.05rem] text-tinta-suave">Carregando...</p>
      </section>
    );
  }

  return (
    <section
      aria-labelledby="titulo-inscricoes"
      className={`rounded-3xl border-2 p-6 shadow-sm sm:p-7 ${
        abertas ? "border-sucesso-700 bg-sucesso-50" : "border-borda bg-papel-alt"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div className="flex items-start gap-4">
          <span
            className={`mt-0.5 flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${
              abertas ? "bg-white text-sucesso-700" : "bg-white text-tinta-suave"
            }`}
          >
            <Icone nome={abertas ? "check" : "cadeado"} className="h-8 w-8" />
          </span>
          <div>
            <h2
              id="titulo-inscricoes"
              className="text-[1.3rem] font-extrabold text-marca-900"
            >
              Inscrições no site
            </h2>
            <p
              aria-live="polite"
              className={`mt-1 text-[1.12rem] font-extrabold ${
                abertas ? "text-sucesso-700" : "text-tinta-suave"
              }`}
            >
              {abertas ? "Abertas — o site aceita inscrições" : "Encerradas — o site não aceita inscrições"}
            </p>
            <p className="mt-2 max-w-md text-[1.02rem] leading-relaxed text-tinta-suave">
              {abertas
                ? "Qualquer pessoa consegue preencher o formulário."
                : "Quem entrar no site vê um aviso no lugar do formulário. Você pode reabrir quando quiser."}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setConfirmando(abertas ? "fechar" : "abrir")}
          disabled={ocupado}
          className={`rounded-xl px-6 py-4 text-[1.05rem] font-extrabold text-white transition disabled:bg-tinta-suave ${
            abertas
              ? "bg-erro-600 hover:bg-erro-700"
              : "bg-sucesso-700 hover:brightness-110"
          }`}
        >
          {abertas ? "ENCERRAR INSCRIÇÕES" : "REABRIR INSCRIÇÕES"}
        </button>
      </div>

      {erro && (
        <p
          role="alert"
          className="mt-5 rounded-2xl border-2 border-erro-600 bg-white p-4 text-[1.05rem] font-bold text-erro-700"
        >
          {erro}
        </p>
      )}

      <DialogoConfirmacao
        aberto={confirmando !== null}
        titulo={
          confirmando === "fechar"
            ? "Encerrar as inscrições?"
            : "Reabrir as inscrições?"
        }
        descricao={
          confirmando === "fechar"
            ? "O formulário sai do ar na hora. Quem entrar no site vê um aviso de inscrições encerradas. As inscrições já recebidas continuam guardadas."
            : "O formulário volta ao ar na hora e qualquer pessoa poderá se inscrever novamente."
        }
        textoConfirmar={
          confirmando === "fechar" ? "Sim, encerrar" : "Sim, reabrir"
        }
        processando={ocupado}
        aoConfirmar={aplicar}
        aoCancelar={() => {
          if (!ocupado) setConfirmando(null);
        }}
      />
    </section>
  );
}
