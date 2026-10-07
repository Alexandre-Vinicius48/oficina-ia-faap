"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Icone } from "@/components/Icones";
import { DialogoConfirmacao } from "@/components/DialogoConfirmacao";
import { formatarData, formatarHora } from "@/lib/format";
import { NOME_ARQUIVO_EXCEL_PESQUISA } from "@/config/oficina";
import {
  PERGUNTAS_ABERTAS,
  TOTAL_DE_PERGUNTAS,
  type ColunaAberta,
} from "@/lib/pesquisa";

type Estado = { aberta: boolean; codigo: string | null; total: number };

type RespostaPesquisa = {
  id: string;
  nome: string;
  respostas: Record<string, number>;
  mais_gostou: string | null;
  melhorar: string | null;
  como_usar: string | null;
  created_at: string;
};

/**
 * O QUESTIONARIO FINAL NO PAINEL.
 *
 * Mesma mecanica da avaliacao de aula: o responsavel libera, projeta o QR
 * Code, a turma entra com celular + codigo. A diferenca e que aqui nao ha
 * aula nenhuma — a pesquisa e sobre os quatro encontros juntos, entao e uma
 * chave so, ligada ou desligada.
 */
export function PainelPesquisa() {
  const router = useRouter();

  const [estado, setEstado] = useState<Estado | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  const [qrCode, setQrCode] = useState<string | null>(null);
  const [endereco, setEndereco] = useState<string | null>(null);

  const [confirmandoFechar, setConfirmandoFechar] = useState(false);
  const [baixando, setBaixando] = useState(false);

  const [respostas, setRespostas] = useState<RespostaPesquisa[] | null>(null);
  const [mostrando, setMostrando] = useState(false);
  const [paraExcluir, setParaExcluir] = useState<RespostaPesquisa | null>(null);
  const [excluindo, setExcluindo] = useState(false);

  const chamar = useCallback(
    async (corpo: Record<string, unknown>) => {
      const resposta = await fetch("/api/admin/pesquisa", {
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

  useEffect(() => {
    let cancelado = false;
    (async () => {
      const dados = await chamar({ acao: "listar" });
      if (cancelado) return;
      if (dados) setEstado(dados.estado ?? null);
      setCarregando(false);
    })();
    return () => {
      cancelado = true;
    };
  }, [chamar]);

  async function abrir() {
    if (ocupado) return;
    setOcupado(true);
    setErro(null);
    const dados = await chamar({ acao: "abrir" });
    if (dados) {
      setEstado(dados.estado ?? null);
      setQrCode(dados.qrCode ?? null);
      setEndereco(dados.endereco ?? null);
    }
    setOcupado(false);
  }

  async function fechar() {
    if (ocupado) return;
    setOcupado(true);
    const dados = await chamar({ acao: "fechar" });
    if (dados) {
      setEstado(dados.estado ?? null);
      setQrCode(null);
      setEndereco(null);
    }
    setConfirmandoFechar(false);
    setOcupado(false);
  }

  async function carregarRespostas(limparAntes = true) {
    if (limparAntes) setRespostas(null);
    const dados = await chamar({ acao: "respostas" });
    if (dados) setRespostas(dados.itens ?? []);
  }

  async function verRespostas() {
    setMostrando(true);
    await carregarRespostas();
  }

  async function confirmarExclusao() {
    if (!paraExcluir || excluindo) return;
    setExcluindo(true);
    setErro(null);
    const dados = await chamar({ acao: "excluir", id: paraExcluir.id });
    if (dados) {
      setEstado(dados.estado ?? null);
      setParaExcluir(null);
      await carregarRespostas(false);
    }
    setExcluindo(false);
  }

  async function baixarExcel() {
    if (baixando) return;
    setBaixando(true);
    setAviso(null);
    setErro(null);
    try {
      const resposta = await fetch("/api/admin/exportar-pesquisa", {
        cache: "no-store",
      });
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
      const url = URL.createObjectURL(arquivo);
      const link = document.createElement("a");
      link.href = url;
      link.download = NOME_ARQUIVO_EXCEL_PESQUISA;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
      setAviso("Planilha do questionário final baixada com sucesso.");
    } catch {
      setErro("Sem conexão com a internet. Tente novamente.");
    } finally {
      setBaixando(false);
    }
  }

  const total = estado?.total ?? 0;
  const aberta = estado?.aberta ?? false;

  return (
    <section aria-labelledby="titulo-pesquisa" className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2
          id="titulo-pesquisa"
          className="text-[1.4rem] font-extrabold text-marca-900"
        >
          Questionário final
          {carregando && (
            <span className="ml-3 text-[1rem] font-normal text-tinta-suave">
              Carregando...
            </span>
          )}
        </h2>

        <button
          type="button"
          onClick={baixarExcel}
          disabled={baixando || total === 0}
          aria-busy={baixando}
          title={total === 0 ? "Ainda não há respostas para exportar" : undefined}
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
              BAIXAR QUESTIONÁRIO FINAL
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

      {/* ---------------- Estado e botão de liberar ---------------- */}
      <div
        className={`rounded-3xl border-2 bg-white p-6 shadow-sm ${
          aberta ? "border-acolhe-600" : "border-borda"
        }`}
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <span
              aria-hidden="true"
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-marca-700 text-white"
            >
              <Icone nome="escrita" className="h-7 w-7" />
            </span>
            <div>
              <p className="text-[1.15rem] font-extrabold text-tinta">
                Pesquisa de satisfação dos quatro encontros
              </p>
              <p className="mt-1 text-[1.02rem] text-tinta-suave">
                {TOTAL_DE_PERGUNTAS} perguntas de marcar e 3 para escrever
                {aberta && (
                  <span className="ml-3 font-extrabold text-acolhe-700">
                    Liberado agora
                  </span>
                )}
              </p>
              <p className="mt-2 text-[1.02rem] text-tinta">
                <strong className="font-extrabold">{total}</strong>{" "}
                {total === 1 ? "pessoa respondeu" : "pessoas responderam"}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            {aberta ? (
              <button
                type="button"
                onClick={() => setConfirmandoFechar(true)}
                disabled={ocupado}
                className="rounded-xl border-2 border-erro-600 bg-white px-5 py-3 text-[1.02rem] font-extrabold text-erro-700 transition hover:bg-erro-50 disabled:opacity-60"
              >
                Encerrar questionário
              </button>
            ) : (
              <button
                type="button"
                onClick={abrir}
                disabled={ocupado}
                className="rounded-xl bg-acolhe-700 px-5 py-3 text-[1.02rem] font-extrabold text-white transition hover:bg-acolhe-800 disabled:bg-tinta-suave"
              >
                Liberar questionário
              </button>
            )}

            {total > 0 && (
              <button
                type="button"
                onClick={mostrando ? () => setMostrando(false) : verRespostas}
                className="rounded-xl border-2 border-borda bg-white px-5 py-3 text-[1.02rem] font-extrabold text-tinta transition hover:bg-papel"
              >
                {mostrando ? "Ocultar respostas" : "Ver respostas"}
              </button>
            )}
          </div>
        </div>

        {/* ---------------- Respostas ---------------- */}
        {mostrando && (
          <div className="mt-6 border-t-2 border-borda pt-6">
            {respostas === null ? (
              <p className="text-[1.05rem] text-tinta-suave">
                Carregando respostas...
              </p>
            ) : respostas.length === 0 ? (
              <p className="text-[1.05rem] text-tinta-suave">
                Ninguém respondeu ainda.
              </p>
            ) : (
              <>
                <ul className="space-y-3">
                  {respostas.map((r) => {
                    const marcadas = Object.keys(r.respostas ?? {}).length;
                    return (
                      <li
                        key={r.id}
                        className="flex flex-wrap items-start justify-between gap-4 rounded-2xl border-2 border-borda bg-papel-alt p-4"
                      >
                        <div className="min-w-[14rem] flex-1 space-y-2">
                          <p className="text-[1.05rem] text-tinta">
                            <strong className="font-extrabold">{r.nome}</strong>
                            <span className="text-tinta-suave">
                              {" "}
                              · {marcadas} de {TOTAL_DE_PERGUNTAS} marcadas ·{" "}
                              {formatarData(r.created_at)} às{" "}
                              {formatarHora(r.created_at)}
                            </span>
                          </p>

                          {PERGUNTAS_ABERTAS.map((pergunta) => {
                            const texto = r[pergunta.coluna as ColunaAberta];
                            if (!texto) return null;
                            return (
                              <p
                                key={pergunta.coluna}
                                className="text-[1.02rem] leading-relaxed text-tinta"
                              >
                                <span className="font-bold text-tinta-suave">
                                  {pergunta.texto}
                                </span>
                                <br />“{texto}”
                              </p>
                            );
                          })}
                        </div>

                        <button
                          type="button"
                          onClick={() => setParaExcluir(r)}
                          aria-label={`Excluir a resposta de ${r.nome}`}
                          title="Excluir resposta"
                          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border-2 border-borda bg-white text-erro-700 transition hover:border-erro-600 hover:bg-erro-50"
                        >
                          <Icone nome="lixeira" className="h-6 w-6" />
                        </button>
                      </li>
                    );
                  })}
                </ul>

                <p className="mt-5 text-[0.98rem] text-tinta-suave">
                  Aqui aparece só o que foi escrito à mão. As{" "}
                  {TOTAL_DE_PERGUNTAS} alternativas marcadas estão na planilha e
                  no dashboard.
                </p>
              </>
            )}
          </div>
        )}
      </div>

      {/* ---------------- QR para projetar ---------------- */}
      {qrCode && aberta && (
        <div className="rounded-3xl border-2 border-acolhe-600 bg-acolhe-50 p-6 sm:p-8">
          <h3 className="text-[1.3rem] font-extrabold text-acolhe-800">
            Mostre esta tela para a turma
          </h3>
          <p className="mt-2 text-[1.05rem] text-tinta">
            Questionário final — pesquisa de satisfação
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
                Código do questionário
              </p>
              <p className="fonte-titulo mt-1 text-[3.4rem] leading-none font-extrabold tracking-[0.15em] text-acolhe-800">
                {estado?.codigo}
              </p>
              <p className="mt-4 max-w-xs text-[0.98rem] leading-relaxed text-tinta-suave">
                O código muda toda vez que você libera o questionário. Só quem
                está na sala consegue vê-lo.
              </p>
            </div>
          </div>
        </div>
      )}

      {aberta && !qrCode && (
        <p className="rounded-2xl border-2 border-borda bg-papel-alt p-5 text-[1.05rem] text-tinta">
          O questionário está liberado. Para ver o QR Code de novo, encerre e
          libere outra vez — isso gera um código novo.
        </p>
      )}

      <DialogoConfirmacao
        aberto={confirmandoFechar}
        titulo="Encerrar o questionário?"
        descricao="Depois de encerrar, ninguém mais consegue responder. As respostas já enviadas continuam guardadas."
        textoConfirmar="Sim, encerrar"
        processando={ocupado}
        aoConfirmar={fechar}
        aoCancelar={() => {
          if (!ocupado) setConfirmandoFechar(false);
        }}
      />

      <DialogoConfirmacao
        aberto={paraExcluir !== null}
        titulo="Excluir esta resposta?"
        descricao="As respostas desta pessoa serão apagadas do banco de dados definitivamente. Não é possível desfazer."
        detalhe={paraExcluir ? paraExcluir.nome : undefined}
        textoConfirmar="Sim, excluir"
        processando={excluindo}
        aoConfirmar={confirmarExclusao}
        aoCancelar={() => {
          if (!excluindo) setParaExcluir(null);
        }}
      />
    </section>
  );
}
