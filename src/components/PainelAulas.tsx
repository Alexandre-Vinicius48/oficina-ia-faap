"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DialogoConfirmacao } from "@/components/DialogoConfirmacao";
import { ROSTOS } from "@/lib/escala";
import { formatarData, formatarHora } from "@/lib/format";

type Aula = {
  id: string;
  numero: number;
  tema: string;
  data: string;
  aberta: boolean;
  codigo: string | null;
  totalDeAvaliacoes: number;
  media: number | null;
};

type Avaliacao = {
  id: string;
  nota: number;
  comentario: string | null;
  created_at: string;
};

/** 2026-10-05 -> 05/10/2026, sem cair no fuso do navegador. */
function dataCurta(data: string): string {
  const [ano, mes, dia] = data.split("-");
  return ano && mes && dia ? `${dia}/${mes}/${ano}` : data;
}

export function PainelAulas() {
  const router = useRouter();

  const [aulas, setAulas] = useState<Aula[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const [qrCode, setQrCode] = useState<string | null>(null);
  const [endereco, setEndereco] = useState<string | null>(null);

  const [paraFechar, setParaFechar] = useState<Aula | null>(null);

  const [aulaAberta, setAulaAberta] = useState<Aula | null>(null);
  const [avaliacoes, setAvaliacoes] = useState<Avaliacao[] | null>(null);
  const [distribuicao, setDistribuicao] = useState<number[]>([]);

  const chamar = useCallback(
    async (corpo: Record<string, unknown>) => {
      const resposta = await fetch("/api/admin/aulas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify(corpo),
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
    },
    [router],
  );

  // Carrega a lista ao abrir a tela. Todo setState acontece DEPOIS do await:
  // mudar estado de forma sincrona dentro de um efeito dispara renderizacoes
  // em cascata. A flag "cancelado" evita atualizar uma tela ja fechada.
  useEffect(() => {
    let cancelado = false;

    (async () => {
      const dados = await chamar({ acao: "listar" });
      if (cancelado) return;
      if (dados) setAulas(dados.aulas ?? []);
      setCarregando(false);
    })();

    return () => {
      cancelado = true;
    };
  }, [chamar]);

  async function abrir(aula: Aula) {
    if (ocupado) return;
    setOcupado(true);
    setErro(null);
    const dados = await chamar({ acao: "abrir", aulaId: aula.id });
    if (dados) {
      setAulas(dados.aulas ?? []);
      setQrCode(dados.qrCode ?? null);
      setEndereco(dados.endereco ?? null);
    }
    setOcupado(false);
  }

  async function fechar() {
    if (!paraFechar || ocupado) return;
    setOcupado(true);
    const dados = await chamar({ acao: "fechar", aulaId: paraFechar.id });
    if (dados) {
      setAulas(dados.aulas ?? []);
      setQrCode(null);
      setEndereco(null);
    }
    setParaFechar(null);
    setOcupado(false);
  }

  async function verAvaliacoes(aula: Aula) {
    setAulaAberta(aula);
    setAvaliacoes(null);
    const resposta = await fetch("/api/admin/avaliacoes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
      body: JSON.stringify({ aulaId: aula.id }),
    });
    if (!resposta.ok) {
      setErro("Não foi possível carregar as avaliações.");
      return;
    }
    const dados = await resposta.json();
    setAvaliacoes(dados.itens ?? []);
    setDistribuicao(dados.distribuicao ?? []);
  }

  const abertaAgora = aulas.find((a) => a.aberta) ?? null;

  return (
    <section aria-labelledby="titulo-aulas" className="space-y-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="titulo-aulas" className="text-[1.4rem] font-extrabold text-marca-900">
          Aulas e avaliações
        </h2>
        {carregando && (
          <p className="text-[1rem] text-tinta-suave">Carregando...</p>
        )}
      </div>

      {erro && (
        <p
          role="alert"
          className="rounded-2xl border-2 border-erro-600 bg-erro-50 p-5 text-[1.05rem] font-bold text-erro-700"
        >
          {erro}
        </p>
      )}

      {/* ---------------- QR para projetar ---------------- */}
      {qrCode && abertaAgora && (
        <div className="rounded-3xl border-2 border-acolhe-600 bg-acolhe-50 p-6 sm:p-8">
          <h3 className="text-[1.3rem] font-extrabold text-acolhe-800">
            Mostre esta tela para a turma
          </h3>
          <p className="mt-2 text-[1.05rem] text-tinta">
            Aula {abertaAgora.numero} — {abertaAgora.tema}
          </p>

          <div className="mt-6 flex flex-col items-center gap-6 sm:flex-row sm:items-start">
            <div
              className="shrink-0 rounded-2xl bg-white p-4 shadow-sm [&>svg]:h-56 [&>svg]:w-56"
              // O QR é gerado no servidor, sem biblioteca no navegador.
              dangerouslySetInnerHTML={{ __html: qrCode }}
            />
            <div>
              <p className="text-[1.05rem] font-bold text-tinta-suave">
                Quem não conseguir usar a câmera pode digitar:
              </p>
              <p className="mt-2 text-[1.1rem] font-semibold break-all text-tinta">
                {endereco?.replace(/\?.*$/, "")}
              </p>
              <p className="mt-5 text-[1.05rem] font-bold text-tinta-suave">
                Código da aula
              </p>
              <p className="fonte-titulo mt-1 text-[3.4rem] leading-none font-extrabold tracking-[0.15em] text-acolhe-800">
                {abertaAgora.codigo}
              </p>
              <p className="mt-4 max-w-xs text-[0.98rem] leading-relaxed text-tinta-suave">
                O código muda toda vez que você abre a avaliação. Só quem está na
                sala consegue vê-lo.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- Lista de aulas ---------------- */}
      <ul className="space-y-4">
        {aulas.map((aula) => (
          <li
            key={aula.id}
            className={`rounded-3xl border-2 bg-white p-6 shadow-sm ${
              aula.aberta ? "border-acolhe-600" : "border-borda"
            }`}
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <span
                  aria-hidden="true"
                  className="fonte-titulo flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-marca-700 text-[1.2rem] font-extrabold text-white"
                >
                  {aula.numero}
                </span>
                <div>
                  <p className="text-[1.15rem] font-extrabold text-tinta">
                    {aula.tema}
                  </p>
                  <p className="mt-1 text-[1.02rem] text-tinta-suave">
                    {dataCurta(aula.data)}
                    {aula.aberta && (
                      <span className="ml-3 font-extrabold text-acolhe-700">
                        Avaliação aberta
                      </span>
                    )}
                  </p>
                  <p className="mt-2 text-[1.02rem] text-tinta">
                    <strong className="font-extrabold">
                      {aula.totalDeAvaliacoes}
                    </strong>{" "}
                    {aula.totalDeAvaliacoes === 1 ? "avaliação" : "avaliações"}
                    {aula.media !== null && (
                      <>
                        {" · média "}
                        <strong className="font-extrabold">{aula.media}</strong>
                        {" de 5"}
                      </>
                    )}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                {aula.aberta ? (
                  <button
                    type="button"
                    onClick={() => setParaFechar(aula)}
                    disabled={ocupado}
                    className="rounded-xl border-2 border-erro-600 bg-white px-5 py-3 text-[1.02rem] font-extrabold text-erro-700 transition hover:bg-erro-50 disabled:opacity-60"
                  >
                    Encerrar avaliação
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => abrir(aula)}
                    disabled={ocupado}
                    className="rounded-xl bg-acolhe-700 px-5 py-3 text-[1.02rem] font-extrabold text-white transition hover:bg-acolhe-800 disabled:bg-tinta-suave"
                  >
                    Abrir avaliação
                  </button>
                )}

                {aula.totalDeAvaliacoes > 0 && (
                  <button
                    type="button"
                    onClick={() => verAvaliacoes(aula)}
                    className="rounded-xl border-2 border-borda bg-white px-5 py-3 text-[1.02rem] font-extrabold text-tinta transition hover:bg-papel"
                  >
                    Ver respostas
                  </button>
                )}
              </div>
            </div>

            {/* ---------------- Respostas ---------------- */}
            {aulaAberta?.id === aula.id && (
              <div className="mt-6 border-t-2 border-borda pt-6">
                {avaliacoes === null ? (
                  <p className="text-[1.05rem] text-tinta-suave">
                    Carregando respostas...
                  </p>
                ) : (
                  <>
                    <ul className="mb-6 space-y-2">
                      {ROSTOS.map((rosto) => {
                        const quantos = distribuicao[rosto.nota - 1] ?? 0;
                        const maior = Math.max(1, ...distribuicao);
                        return (
                          <li key={rosto.nota} className="flex items-center gap-3">
                            <span className="w-28 shrink-0 text-[1rem] font-bold text-tinta-suave">
                              {rosto.rotulo}
                            </span>
                            <span className="h-6 flex-1 overflow-hidden rounded-full bg-papel-alt">
                              <span
                                className="block h-full rounded-full"
                                style={{
                                  width: `${(quantos / maior) * 100}%`,
                                  backgroundColor: rosto.cor,
                                }}
                              />
                            </span>
                            <span className="w-10 shrink-0 text-right text-[1.02rem] font-extrabold text-tinta">
                              {quantos}
                            </span>
                          </li>
                        );
                      })}
                    </ul>

                    {avaliacoes.filter((a) => a.comentario).length === 0 ? (
                      <p className="text-[1.05rem] text-tinta-suave">
                        Ninguém escreveu comentário nesta aula.
                      </p>
                    ) : (
                      <ul className="space-y-3">
                        {avaliacoes
                          .filter((a) => a.comentario)
                          .map((a) => (
                            <li
                              key={a.id}
                              className="rounded-2xl border-2 border-borda bg-papel-alt p-4"
                            >
                              <p className="text-[1.05rem] leading-relaxed text-tinta">
                                “{a.comentario}”
                              </p>
                              <p className="mt-2 text-[0.95rem] text-tinta-suave">
                                {ROSTOS[a.nota - 1]?.rotulo} ·{" "}
                                {formatarData(a.created_at)} às{" "}
                                {formatarHora(a.created_at)}
                              </p>
                            </li>
                          ))}
                      </ul>
                    )}

                    <p className="mt-5 text-[0.98rem] text-tinta-suave">
                      As respostas não mostram quem escreveu. O celular é pedido
                      apenas para conferir a inscrição e evitar resposta repetida.
                    </p>
                  </>
                )}
              </div>
            )}
          </li>
        ))}
      </ul>

      <DialogoConfirmacao
        aberto={paraFechar !== null}
        titulo="Encerrar a avaliação?"
        descricao="Depois de encerrar, ninguém mais consegue avaliar esta aula. As respostas já enviadas continuam guardadas."
        detalhe={paraFechar ? `Aula ${paraFechar.numero} — ${paraFechar.tema}` : undefined}
        textoConfirmar="Sim, encerrar"
        processando={ocupado}
        aoConfirmar={fechar}
        aoCancelar={() => {
          if (!ocupado) setParaFechar(null);
        }}
      />
    </section>
  );
}
