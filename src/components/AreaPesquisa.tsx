"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Campo } from "@/components/Campo";
import { Icone } from "@/components/Icones";
import { Comemoracao } from "@/components/Comemoracao";
import { mascararCelular } from "@/lib/format";
import { contarPalavras } from "@/lib/validacao";
import {
  ESCALA_PESQUISA,
  LIMITE_DE_PALAVRAS_PESQUISA,
  NUMERO_DA_PERGUNTA,
  PERGUNTAS_ABERTAS,
  SECOES_PESQUISA,
  TOTAL_DE_PERGUNTAS,
  type ColunaAberta,
} from "@/lib/pesquisa";

type Etapa = "entrada" | "responder" | "pronto" | "jaRespondeu";

/**
 * Onde o rascunho fica enquanto a pessoa responde.
 *
 * sessionStorage, e nao localStorage: some quando a aba fecha. Numa sala
 * com aparelhos emprestados, as respostas de uma pessoa nao podem ficar
 * esperando a proxima. Serve so para o caso de a tela recarregar no meio —
 * sao 28 perguntas, e perder tudo por um toque errado seria cruel.
 */
const RASCUNHO = "pesquisa-oficina-ia";

type Rascunho = {
  respostas: Record<string, number>;
  escritas: Record<string, string>;
};

function lerRascunho(): Rascunho | null {
  try {
    const bruto = sessionStorage.getItem(RASCUNHO);
    if (!bruto) return null;
    const dados = JSON.parse(bruto) as Rascunho;
    if (!dados || typeof dados !== "object") return null;
    return {
      respostas: dados.respostas ?? {},
      escritas: dados.escritas ?? {},
    };
  } catch {
    return null;
  }
}

function gravarRascunho(dados: Rascunho) {
  try {
    sessionStorage.setItem(RASCUNHO, JSON.stringify(dados));
  } catch {
    // Aba anonima ou armazenamento bloqueado: segue sem rascunho.
  }
}

function apagarRascunho() {
  try {
    sessionStorage.removeItem(RASCUNHO);
  } catch {
    /* nada a fazer */
  }
}

/* ========================================================================= */

/**
 * Uma afirmacao com as seis alternativas.
 *
 * As alternativas ficam SEMPRE uma embaixo da outra, inclusive no
 * computador. Seis opcoes lado a lado em um celular dariam cerca de 55px
 * para cada uma, com o texto quebrado em tres linhas — e a maior delas,
 * "Nem concordo, nem discordo", nem caberia. Em coluna, cada alternativa e
 * uma faixa larga, do tamanho de um botao, com a bolinha a esquerda.
 */
function Afirmacao({
  chave,
  numero,
  texto,
  valor,
  aoEscolher,
  desabilitado,
  faltando,
  registrarRef,
}: {
  chave: string;
  numero: number;
  texto: string;
  valor: number | undefined;
  aoEscolher: (valor: number) => void;
  desabilitado: boolean;
  faltando: boolean;
  registrarRef: (chave: string, elemento: HTMLFieldSetElement | null) => void;
}) {
  return (
    <fieldset
      ref={(el) => registrarRef(chave, el)}
      tabIndex={-1}
      aria-invalid={faltando || undefined}
      aria-describedby={faltando ? `falta-${chave}` : undefined}
      className={`scroll-mt-32 rounded-3xl border-2 p-5 outline-none sm:p-6 ${
        faltando ? "border-erro-600 bg-erro-50" : "border-borda bg-white"
      }`}
    >
      <legend className="float-left mb-4 flex w-full gap-3 text-[1.12rem] leading-snug font-extrabold text-tinta sm:text-[1.18rem]">
        <span
          aria-hidden="true"
          className="fonte-titulo mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-marca-700 text-[0.95rem] font-extrabold text-white"
        >
          {numero}
        </span>
        <span>
          <span className="sr-only">Pergunta {numero} de {TOTAL_DE_PERGUNTAS}: </span>
          {texto}
        </span>
      </legend>

      <div className="clear-both space-y-2">
        {ESCALA_PESQUISA.map((opcao) => {
          const escolhido = valor === opcao.valor;
          return (
            <label
              key={opcao.valor}
              className={`flex min-h-[3.5rem] cursor-pointer items-center gap-4 rounded-2xl border-2 px-4 py-3 transition has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-acolhe-600 ${
                escolhido
                  ? "border-marca-600 bg-marca-50"
                  : "border-borda bg-white hover:bg-papel-alt"
              } ${desabilitado ? "cursor-not-allowed opacity-60" : ""}`}
            >
              <input
                type="radio"
                name={chave}
                value={opcao.valor}
                checked={escolhido}
                disabled={desabilitado}
                onChange={() => aoEscolher(opcao.valor)}
                className="peer sr-only"
              />

              {/* A bolinha. Desenhada a mao para ficar grande o bastante
                  para ser vista e tocada — a bolinha padrao do navegador
                  tem cerca de 13px e nao cresce junto com a fonte. */}
              <span
                aria-hidden="true"
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-[3px] transition peer-focus-visible:ring-4 peer-focus-visible:ring-acolhe-600 ${
                  escolhido ? "border-marca-600" : "border-tinta-suave"
                }`}
              >
                {escolhido && (
                  <span className="h-4 w-4 rounded-full bg-marca-600" />
                )}
              </span>

              <span
                className={`text-[1.08rem] leading-tight ${
                  escolhido ? "font-extrabold text-marca-800" : "font-semibold text-tinta"
                }`}
              >
                {opcao.rotulo}
              </span>
            </label>
          );
        })}
      </div>

      {faltando && (
        <p
          id={`falta-${chave}`}
          role="alert"
          className="mt-3 flex items-start gap-2 text-[1.02rem] font-bold text-erro-700"
        >
          <span aria-hidden="true">⚠</span>
          Falta escolher uma alternativa nesta pergunta.
        </p>
      )}
    </fieldset>
  );
}

/* ========================================================================= */

export function AreaPesquisa() {
  const parametros = useSearchParams();

  const [etapa, setEtapa] = useState<Etapa>("entrada");
  const [celular, setCelular] = useState("");
  // O QR Code projetado na sala já traz o código no endereço.
  const [codigo, setCodigo] = useState(() =>
    (parametros.get("c") ?? "").replace(/\D/g, "").slice(0, 4),
  );
  const [erros, setErros] = useState<{ celular?: string; codigo?: string }>({});
  const [erroGeral, setErroGeral] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [primeiroNome, setPrimeiroNome] = useState("");

  const [respostas, setRespostas] = useState<Record<string, number>>({});
  const [escritas, setEscritas] = useState<Record<string, string>>({});
  const [faltantes, setFaltantes] = useState<string[]>([]);

  const campoCelular = useRef<HTMLInputElement>(null);
  const campoCodigo = useRef<HTMLInputElement>(null);
  const titulo = useRef<HTMLHeadingElement>(null);
  const caixas = useRef(new Map<string, HTMLFieldSetElement>());

  function registrarRef(chave: string, elemento: HTMLFieldSetElement | null) {
    if (elemento) caixas.current.set(chave, elemento);
    else caixas.current.delete(chave);
  }

  // Ao trocar de etapa, leva o foco para o novo título — quem usa leitor de
  // tela precisa saber que a tela mudou.
  useEffect(() => {
    if (etapa !== "entrada") titulo.current?.focus();
  }, [etapa]);

  const respondidas = useMemo(
    () => Object.keys(respostas).length,
    [respostas],
  );

  function escolher(chave: string, valor: number) {
    setRespostas((anterior) => {
      const novo = { ...anterior, [chave]: valor };
      gravarRascunho({ respostas: novo, escritas });
      return novo;
    });
    setFaltantes((anterior) => anterior.filter((c) => c !== chave));
  }

  function escrever(coluna: ColunaAberta, texto: string) {
    setEscritas((anterior) => {
      const novo = { ...anterior, [coluna]: texto };
      gravarRascunho({ respostas, escritas: novo });
      return novo;
    });
  }

  /* ---------------------------- entrada ---------------------------- */

  async function entrar(evento: React.FormEvent) {
    evento.preventDefault();
    if (ocupado) return;

    setErroGeral(null);
    setErros({});

    if (celular.replace(/\D/g, "").length < 10) {
      setErros({ celular: "Digite seu celular com DDD." });
      campoCelular.current?.focus();
      return;
    }
    if (codigo.replace(/\D/g, "").length !== 4) {
      setErros({ codigo: "O código tem 4 números." });
      campoCodigo.current?.focus();
      return;
    }

    setOcupado(true);
    try {
      const resposta = await fetch("/api/pesquisa/entrar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({ celular, codigo }),
      });
      const corpo = await resposta.json().catch(() => ({}));

      if (resposta.ok) {
        setPrimeiroNome(corpo.primeiroNome ?? "");
        if (corpo.jaRespondeu) {
          setEtapa("jaRespondeu");
          return;
        }
        // Recupera o rascunho aqui, e nao em um efeito: quem recarregou a
        // tela no meio das 28 perguntas volta de onde parou.
        const guardado = lerRascunho();
        if (guardado) {
          setRespostas(guardado.respostas);
          setEscritas(guardado.escritas);
        }
        setEtapa("responder");
        return;
      }

      if (corpo.campo === "celular" || corpo.campo === "codigo") {
        setErros({ [corpo.campo]: corpo.erro });
        (corpo.campo === "celular" ? campoCelular : campoCodigo).current?.focus();
        return;
      }
      setErroGeral(corpo.erro ?? "Não conseguimos entrar. Tente novamente.");
    } catch {
      setErroGeral("Sem conexão com a internet. Tente novamente.");
    } finally {
      setOcupado(false);
    }
  }

  /* ---------------------------- envio ---------------------------- */

  function primeiraSemResposta(): string | null {
    for (const secao of SECOES_PESQUISA) {
      for (const pergunta of secao.perguntas) {
        if (respostas[pergunta.chave] === undefined) return pergunta.chave;
      }
    }
    return null;
  }

  async function enviar(evento: React.FormEvent) {
    evento.preventDefault();
    if (ocupado) return;

    setErroGeral(null);

    // Mostra TODAS as que faltam de uma vez, e leva a pessoa até a primeira.
    const semResposta = SECOES_PESQUISA.flatMap((s) => s.perguntas)
      .filter((p) => respostas[p.chave] === undefined)
      .map((p) => p.chave);

    if (semResposta.length > 0) {
      setFaltantes(semResposta);
      const primeira = primeiraSemResposta();
      if (primeira) {
        const caixa = caixas.current.get(primeira);
        caixa?.scrollIntoView({ behavior: "smooth", block: "center" });
        caixa?.focus({ preventScroll: true });
      }
      setErroGeral(
        semResposta.length === 1
          ? "Falta responder 1 pergunta. Ela está marcada em vermelho."
          : `Faltam responder ${semResposta.length} perguntas. Elas estão marcadas em vermelho.`,
      );
      return;
    }

    setOcupado(true);
    try {
      const resposta = await fetch("/api/pesquisa/enviar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({
          respostas,
          ...Object.fromEntries(
            PERGUNTAS_ABERTAS.map((p) => [p.coluna, escritas[p.coluna] ?? ""]),
          ),
        }),
      });

      if (resposta.ok) {
        apagarRascunho();
        setEtapa("pronto");
        return;
      }

      const corpo = await resposta.json().catch(() => ({}));
      if (resposta.status === 409) {
        apagarRascunho();
        setEtapa("jaRespondeu");
        return;
      }
      setErroGeral(corpo.erro ?? "Não conseguimos guardar suas respostas.");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setErroGeral("Sem conexão com a internet. Tente novamente.");
    } finally {
      setOcupado(false);
    }
  }

  /* ========================= telas ========================= */

  if (etapa === "pronto" || etapa === "jaRespondeu") {
    const enviouAgora = etapa === "pronto";
    return (
      <>
        <Comemoracao ativo={enviouAgora} />

        <div className="animacao-surgir relative z-10 text-center">
          <span
            className={`mx-auto mb-7 flex h-24 w-24 items-center justify-center rounded-full ${
              enviouAgora
                ? "bg-sucesso-50 text-sucesso-700"
                : "bg-marca-50 text-marca-700"
            }`}
          >
            <Icone nome="check" className="h-14 w-14" />
          </span>
          <h2
            ref={titulo}
            tabIndex={-1}
            className={`text-[1.9rem] leading-tight font-extrabold outline-none sm:text-[2.2rem] ${
              enviouAgora ? "text-sucesso-700" : "text-marca-900"
            }`}
          >
            {enviouAgora
              ? "Questionário enviado. Muito obrigado!"
              : "Você já respondeu ao questionário"}
          </h2>
          <p className="mx-auto mt-5 max-w-lg text-[1.15rem] leading-relaxed text-tinta-suave">
            {enviouAgora
              ? "Suas respostas ajudam a melhorar as próximas edições da oficina. Foi muito bom ter você com a gente nos quatro encontros!"
              : "Suas respostas já foram registradas. Obrigado por participar!"}
          </p>
        </div>
      </>
    );
  }

  if (etapa === "responder") {
    const falta = TOTAL_DE_PERGUNTAS - respondidas;
    const porcentagem = Math.round((respondidas / TOTAL_DE_PERGUNTAS) * 100);

    return (
      <div className="animacao-surgir">
        <div className="rounded-2xl border-2 border-marca-200 bg-marca-50 p-6">
          <p className="text-[1.15rem] font-extrabold text-marca-900">
            Olá{primeiroNome ? `, ${primeiroNome}` : ""}!
          </p>
          <p className="mt-2 text-[1.05rem] leading-relaxed text-tinta">
            Queremos conhecer sua opinião sobre toda a oficina. Não há respostas
            certas ou erradas. Marque uma alternativa em cada pergunta. Se
            precisar, peça ajuda para ler ou preencher.
          </p>
        </div>

        <h2
          ref={titulo}
          tabIndex={-1}
          className="mt-9 text-[1.6rem] leading-tight font-extrabold text-marca-900 outline-none"
        >
          Questionário final
        </h2>

        {/* Barra de progresso grudada no topo. Com 28 perguntas, a pessoa
            precisa saber a qualquer momento quanto falta — sem isso, a tela
            parece não ter fim. */}
        <div className="sticky top-0 z-20 -mx-6 mt-4 border-y-2 border-borda bg-papel/95 px-6 py-3 backdrop-blur sm:-mx-9 sm:px-9">
          <p
            aria-live="polite"
            className="text-[1.05rem] font-extrabold text-tinta"
          >
            {respondidas} de {TOTAL_DE_PERGUNTAS} respondidas
            {falta > 0 && (
              <span className="font-semibold text-tinta-suave">
                {" "}
                · faltam {falta}
              </span>
            )}
          </p>
          <span
            aria-hidden="true"
            className="mt-2 block h-3 w-full overflow-hidden rounded-full bg-papel-alt"
          >
            <span
              className="block h-full rounded-full bg-acolhe-700 transition-[width] duration-300"
              style={{ width: `${porcentagem}%` }}
            />
          </span>
        </div>

        <form onSubmit={enviar} noValidate className="mt-8 space-y-10">
          {erroGeral && (
            <div
              role="alert"
              className="flex items-start gap-3 rounded-2xl border-2 border-erro-600 bg-erro-50 p-5"
            >
              <span className="mt-1 shrink-0 text-erro-700">
                <Icone nome="alerta" className="h-7 w-7" />
              </span>
              <p className="text-[1.08rem] font-bold text-erro-700">{erroGeral}</p>
            </div>
          )}

          {SECOES_PESQUISA.map((secao) => (
            <section key={secao.titulo} className="space-y-4">
              <h3 className="border-l-4 border-acolhe-600 pl-4 text-[1.25rem] leading-tight font-extrabold text-marca-900">
                {secao.titulo}
              </h3>

              {secao.perguntas.map((pergunta) => (
                <Afirmacao
                  key={pergunta.chave}
                  chave={pergunta.chave}
                  numero={NUMERO_DA_PERGUNTA.get(pergunta.chave) ?? 0}
                  texto={pergunta.texto}
                  valor={respostas[pergunta.chave]}
                  aoEscolher={(v) => escolher(pergunta.chave, v)}
                  desabilitado={ocupado}
                  faltando={faltantes.includes(pergunta.chave)}
                  registrarRef={registrarRef}
                />
              ))}
            </section>
          ))}

          {/* ------------------- perguntas escritas ------------------- */}
          <section className="space-y-4">
            <h3 className="border-l-4 border-acolhe-600 pl-4 text-[1.25rem] leading-tight font-extrabold text-marca-900">
              Para terminar, conte com suas palavras
            </h3>
            <p className="text-[1.05rem] text-tinta-suave">
              Estas três são opcionais. Escreva só se quiser.
            </p>

            {PERGUNTAS_ABERTAS.map((pergunta) => {
              const texto = escritas[pergunta.coluna] ?? "";
              const palavras = contarPalavras(texto);
              const excedeu = palavras > LIMITE_DE_PALAVRAS_PESQUISA;
              return (
                <div
                  key={pergunta.coluna}
                  className="space-y-2 rounded-3xl border-2 border-borda bg-white p-5 sm:p-6"
                >
                  <label
                    htmlFor={pergunta.coluna}
                    className="block text-[1.12rem] leading-snug font-extrabold text-tinta"
                  >
                    {pergunta.texto}
                  </label>
                  <textarea
                    id={pergunta.coluna}
                    rows={4}
                    value={texto}
                    disabled={ocupado}
                    aria-describedby={`${pergunta.coluna}-contador`}
                    aria-invalid={excedeu || undefined}
                    onChange={(e) => escrever(pergunta.coluna, e.target.value)}
                    className={`w-full rounded-xl border-2 bg-white px-4 py-4 text-[1.12rem] text-tinta ${
                      excedeu ? "border-erro-600 bg-erro-50" : "border-borda"
                    }`}
                  />
                  <p
                    id={`${pergunta.coluna}-contador`}
                    aria-live="polite"
                    className={`text-[1rem] font-semibold ${
                      excedeu ? "text-erro-700" : "text-tinta-suave"
                    }`}
                  >
                    {excedeu
                      ? `Passou de ${LIMITE_DE_PALAVRAS_PESQUISA} palavras. Tire ${palavras - LIMITE_DE_PALAVRAS_PESQUISA}.`
                      : `${palavras} de ${LIMITE_DE_PALAVRAS_PESQUISA} palavras`}
                  </p>
                </div>
              );
            })}
          </section>

          <div className="space-y-4">
            <button
              type="submit"
              disabled={ocupado}
              aria-busy={ocupado}
              className="flex w-full items-center justify-center gap-3 rounded-2xl bg-acolhe-700 px-8 py-5 text-[1.25rem] font-extrabold text-white shadow-lg transition hover:bg-acolhe-800 disabled:cursor-not-allowed disabled:bg-tinta-suave"
            >
              {ocupado ? (
                <>
                  <span
                    className="h-7 w-7 animate-spin rounded-full border-4 border-white/40 border-t-white"
                    aria-hidden="true"
                  />
                  Enviando...
                </>
              ) : (
                <>
                  ENVIAR QUESTIONÁRIO
                  <Icone nome="seta" className="h-7 w-7" />
                </>
              )}
            </button>

            <p className="text-center text-[1rem] leading-relaxed text-tinta-suave">
              Suas respostas vão <strong>com o seu nome</strong> para a
              organização da oficina. Pode escrever com sinceridade: serve para
              melhorar as próximas edições.
            </p>
          </div>
        </form>
      </div>
    );
  }

  /* ---------------------------- entrada ---------------------------- */
  return (
    <form onSubmit={entrar} noValidate className="animacao-surgir space-y-7">
      {erroGeral && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-2xl border-2 border-erro-600 bg-erro-50 p-5"
        >
          <span className="mt-1 shrink-0 text-erro-700">
            <Icone nome="alerta" className="h-7 w-7" />
          </span>
          <p className="text-[1.08rem] font-bold text-erro-700">{erroGeral}</p>
        </div>
      )}

      <Campo
        id="celular"
        rotulo="Seu celular"
        ajuda="O mesmo número que você usou na inscrição."
        placeholder="(00) 00000-0000"
        inputMode="tel"
        autoComplete="tel-national"
        maxLength={16}
        value={celular}
        erro={erros.celular}
        disabled={ocupado}
        ref={campoCelular}
        onChange={(e) => setCelular(mascararCelular(e.target.value))}
      />

      <Campo
        id="codigo"
        rotulo="Código mostrado na sala"
        ajuda="São 4 números, projetados na tela."
        placeholder="0000"
        inputMode="numeric"
        autoComplete="off"
        maxLength={4}
        value={codigo}
        erro={erros.codigo}
        disabled={ocupado}
        ref={campoCodigo}
        onChange={(e) => setCodigo(e.target.value.replace(/\D/g, "").slice(0, 4))}
        className="text-center text-[1.6rem] tracking-[0.5em]"
      />

      <button
        type="submit"
        disabled={ocupado}
        aria-busy={ocupado}
        className="flex w-full items-center justify-center gap-3 rounded-2xl bg-acolhe-700 px-8 py-5 text-[1.25rem] font-extrabold text-white shadow-lg transition hover:bg-acolhe-800 disabled:cursor-not-allowed disabled:bg-tinta-suave"
      >
        {ocupado ? (
          <>
            <span
              className="h-7 w-7 animate-spin rounded-full border-4 border-white/40 border-t-white"
              aria-hidden="true"
            />
            Entrando...
          </>
        ) : (
          <>
            ENTRAR
            <Icone nome="seta" className="h-7 w-7" />
          </>
        )}
      </button>
    </form>
  );
}
