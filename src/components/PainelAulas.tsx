"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Icone } from "@/components/Icones";
import { DialogoConfirmacao } from "@/components/DialogoConfirmacao";
import { ROSTOS } from "@/lib/escala";
import { formatarData, formatarHora } from "@/lib/format";
import { NOME_ARQUIVO_EXCEL_AVALIACOES } from "@/config/oficina";

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

  const [baixando, setBaixando] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);

  const [respostaParaExcluir, setRespostaParaExcluir] = useState<Avaliacao | null>(null);
  const [excluindoResposta, setExcluindoResposta] = useState(false);

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

  async function carregarAvaliacoes(aula: Aula, limparAntes = true) {
    if (limparAntes) setAvaliacoes(null);
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

  async function baixarExcel(aula?: Aula) {
    if (baixando) return;
    setBaixando(true);
    setAviso(null);
    setErro(null);

    try {
      const rota = aula
        ? `/api/admin/exportar-avaliacoes?aula=${encodeURIComponent(aula.id)}`
        : "/api/admin/exportar-avaliacoes";
      const resposta = await fetch(rota, { cache: "no-store" });

      if (resposta.status === 401 || resposta.status === 403) {
        router.replace("/admin");
        return;
      }
      if (!resposta.ok) {
        const c = await resposta.json().catch(() => ({}));
        setErro(c.erro ?? "Não foi possível gerar a planilha.");
        return;
      }

      const arquivo = await resposta.blob();
      const endereco = URL.createObjectURL(arquivo);
      const link = document.createElement("a");
      link.href = endereco;
      link.download = aula
        ? `avaliacoes_aula${aula.numero}_${aula.data}.xlsx`
        : NOME_ARQUIVO_EXCEL_AVALIACOES;
      document.body.appendChild(link);
      link.click();
      link.remove();
      // Libera a memoria so depois que o navegador comecou a baixar.
      setTimeout(() => URL.revokeObjectURL(endereco), 10_000);
      setAviso(
        aula
          ? `Planilha da aula ${aula.numero} baixada com sucesso.`
          : "Planilha com todas as aulas baixada com sucesso.",
      );
    } catch {
      setErro("Sem conexão com a internet. Tente novamente.");
    } finally {
      setBaixando(false);
    }
  }

  async function verAvaliacoes(aula: Aula) {
    setAulaAberta(aula);
    await carregarAvaliacoes(aula);
  }

  async function confirmarExclusaoDaResposta() {
    if (!respostaParaExcluir || excluindoResposta || !aulaAberta) return;

    setExcluindoResposta(true);
    setErro(null);

    try {
      const resposta = await fetch("/api/admin/avaliacoes/excluir", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({ id: respostaParaExcluir.id }),
      });

      if (resposta.status === 401 || resposta.status === 403) {
        router.replace("/admin");
        return;
      }
      if (!resposta.ok) {
        const c = await resposta.json().catch(() => ({}));
        setErro(c.erro ?? "Não foi possível excluir a resposta.");
        return;
      }

      setRespostaParaExcluir(null);
      // Recarrega a lista e os números: total e média mudaram.
      await carregarAvaliacoes(aulaAberta, false);
      const dados = await chamar({ acao: "listar" });
      if (dados) setAulas(dados.aulas ?? []);
    } catch {
      setErro("Sem conexão com a internet. Tente novamente.");
    } finally {
      setExcluindoResposta(false);
    }
  }

  const abertaAgora = aulas.find((a) => a.aberta) ?? null;
  const totalDeRespostas = aulas.reduce((s, a) => s + a.totalDeAvaliacoes, 0);

  return (
    <section aria-labelledby="titulo-aulas" className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 id="titulo-aulas" className="text-[1.4rem] font-extrabold text-marca-900">
          Aulas e avaliações
          {carregando && (
            <span className="ml-3 text-[1rem] font-normal text-tinta-suave">
              Carregando...
            </span>
          )}
        </h2>

        <button
          type="button"
          onClick={() => baixarExcel()}
          disabled={baixando || totalDeRespostas === 0}
          aria-busy={baixando}
          title={
            totalDeRespostas === 0
              ? "Ainda não há respostas para exportar"
              : undefined
          }
          className="flex items-center justify-center gap-3 rounded-2xl bg-sucesso-700 px-6 py-4 text-[1.05rem] font-extrabold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:bg-tinta-suave"
        >
          {baixando ? (
            <>
              <span
                className="h-6 w-6 animate-spin rounded-full border-4 border-white/40 border-t-white"
                aria-hidden="true"
              />
              Gerando planilha...
            </>
          ) : (
            <>
              <Icone nome="planilha" className="h-6 w-6" />
              BAIXAR TODAS AS AVALIAÇÕES
            </>
          )}
        </button>
      </div>

      {aviso && (
        <p role="status" className="text-[1.05rem] font-bold text-sucesso-700">
          {aviso}
        </p>
      )}

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
                  <>
                    <button
                      type="button"
                      onClick={() => verAvaliacoes(aula)}
                      className="rounded-xl border-2 border-borda bg-white px-5 py-3 text-[1.02rem] font-extrabold text-tinta transition hover:bg-papel"
                    >
                      Ver respostas
                    </button>
                    <button
                      type="button"
                      onClick={() => baixarExcel(aula)}
                      disabled={baixando}
                      aria-label={`Baixar as avaliações da aula ${aula.numero} em Excel`}
                      className="flex items-center gap-2 rounded-xl border-2 border-sucesso-700 bg-white px-5 py-3 text-[1.02rem] font-extrabold text-sucesso-700 transition hover:bg-sucesso-50 disabled:opacity-60"
                    >
                      <Icone nome="planilha" className="h-5 w-5" />
                      Baixar desta aula
                    </button>
                  </>
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

                    {/* Todas as respostas aparecem, inclusive as que vieram
                        só com o rostinho. Se listássemos apenas as que têm
                        comentário, uma resposta sem texto — um teste, por
                        exemplo — não teria como ser apagada. */}
                    {avaliacoes.length === 0 ? (
                      <p className="text-[1.05rem] text-tinta-suave">
                        Nenhuma resposta nesta aula.
                      </p>
                    ) : (
                      <ul className="space-y-3">
                        {avaliacoes.map((a) => (
                          <li
                            key={a.id}
                            className="flex flex-wrap items-start justify-between gap-4 rounded-2xl border-2 border-borda bg-papel-alt p-4"
                          >
                            <div className="min-w-[14rem] flex-1">
                              {a.comentario ? (
                                <p className="text-[1.05rem] leading-relaxed text-tinta">
                                  “{a.comentario}”
                                </p>
                              ) : (
                                <p className="text-[1.05rem] text-tinta-suave italic">
                                  Sem comentário
                                </p>
                              )}
                              <p className="mt-2 text-[0.95rem] text-tinta-suave">
                                <strong className="font-extrabold text-tinta">
                                  {ROSTOS[a.nota - 1]?.rotulo}
                                </strong>{" "}
                                · {formatarData(a.created_at)} às{" "}
                                {formatarHora(a.created_at)}
                              </p>
                            </div>

                            <button
                              type="button"
                              onClick={() => setRespostaParaExcluir(a)}
                              aria-label={`Excluir a resposta de ${formatarData(a.created_at)} às ${formatarHora(a.created_at)}`}
                              title="Excluir resposta"
                              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border-2 border-borda bg-white text-erro-700 transition hover:border-erro-600 hover:bg-erro-50"
                            >
                              <Icone nome="lixeira" className="h-6 w-6" />
                            </button>
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
        aberto={respostaParaExcluir !== null}
        titulo="Excluir esta resposta?"
        descricao="A resposta será apagada do banco de dados definitivamente. Não é possível desfazer."
        detalhe={
          respostaParaExcluir
            ? respostaParaExcluir.comentario
              ? `“${respostaParaExcluir.comentario}”`
              : `${ROSTOS[respostaParaExcluir.nota - 1]?.rotulo}, sem comentário`
            : undefined
        }
        textoConfirmar="Sim, excluir"
        processando={excluindoResposta}
        aoConfirmar={confirmarExclusaoDaResposta}
        aoCancelar={() => {
          if (!excluindoResposta) setRespostaParaExcluir(null);
        }}
      />

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
