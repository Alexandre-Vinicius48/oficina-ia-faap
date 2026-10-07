"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Campo } from "@/components/Campo";
import { Icone } from "@/components/Icones";
import { EscalaRostos } from "@/components/EscalaRostos";
import { Comemoracao } from "@/components/Comemoracao";
import { mascararCelular } from "@/lib/format";
import { contarPalavras, LIMITE_DE_PALAVRAS } from "@/lib/validacao";

type Aula = { numero: number; tema: string; data: string };
type Etapa = "entrada" | "avaliar" | "pronto" | "jaAvaliou";

export function AreaParticipante({ totalDeAulas }: { totalDeAulas: number }) {
  const parametros = useSearchParams();

  const [etapa, setEtapa] = useState<Etapa>("entrada");
  const [celular, setCelular] = useState("");
  // O QR Code projetado na sala já traz o código no endereço, então o campo
  // nasce preenchido e a pessoa só digita o próprio celular.
  const [codigo, setCodigo] = useState(() =>
    (parametros.get("c") ?? "").replace(/\D/g, "").slice(0, 4),
  );
  const [erros, setErros] = useState<{ celular?: string; codigo?: string }>({});
  const [erroGeral, setErroGeral] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);

  const [primeiroNome, setPrimeiroNome] = useState("");
  const [aula, setAula] = useState<Aula | null>(null);

  const [nota, setNota] = useState<number | null>(null);
  const [comentario, setComentario] = useState("");
  const [erroNota, setErroNota] = useState<string | undefined>();

  const campoCelular = useRef<HTMLInputElement>(null);
  const campoCodigo = useRef<HTMLInputElement>(null);
  const titulo = useRef<HTMLHeadingElement>(null);

  // Ao trocar de etapa, leva o foco para o novo título — quem usa leitor de
  // tela precisa saber que a tela mudou.
  useEffect(() => {
    if (etapa !== "entrada") titulo.current?.focus();
  }, [etapa]);

  const palavras = contarPalavras(comentario);
  const excedeu = palavras > LIMITE_DE_PALAVRAS;

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
      const resposta = await fetch("/api/avaliacao/entrar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ celular, codigo }),
      });
      const corpo = await resposta.json().catch(() => ({}));

      if (!resposta.ok) {
        const campo = corpo.campo as "celular" | "codigo" | undefined;
        if (campo) {
          setErros({ [campo]: corpo.erro });
          (campo === "celular" ? campoCelular : campoCodigo).current?.focus();
        } else {
          setErroGeral(corpo.erro ?? "Não conseguimos entrar. Tente novamente.");
        }
        return;
      }

      setPrimeiroNome(corpo.primeiroNome ?? "");
      setAula(corpo.aula ?? null);
      setEtapa(corpo.jaAvaliou ? "jaAvaliou" : "avaliar");
    } catch {
      setErroGeral("Sem conexão com a internet. Tente novamente.");
    } finally {
      setOcupado(false);
    }
  }

  async function enviar(evento: React.FormEvent) {
    evento.preventDefault();
    if (ocupado) return;

    setErroGeral(null);
    setErroNota(undefined);

    if (nota === null) {
      setErroNota("Escolha um rosto para dar sua nota.");
      return;
    }
    if (excedeu) return;

    setOcupado(true);
    try {
      const resposta = await fetch("/api/avaliacao/enviar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nota, comentario }),
      });
      const corpo = await resposta.json().catch(() => ({}));

      if (resposta.ok) {
        setEtapa("pronto");
        return;
      }
      if (resposta.status === 409) {
        setEtapa("jaAvaliou");
        return;
      }
      setErroGeral(corpo.erro ?? "Não conseguimos guardar sua avaliação.");
    } catch {
      setErroGeral("Sem conexão com a internet. Tente novamente.");
    } finally {
      setOcupado(false);
    }
  }

  /* ------------------------------------------------------------------ */

  if (etapa === "pronto" || etapa === "jaAvaliou") {
    const enviouAgora = etapa === "pronto";
    return (
      <>
        {/* A mesma festa da inscricao, pelo mesmo motivo: a pessoa fez o que
            pedimos e merece uma resposta alegre. So quem acabou de enviar ve
            — quem volta a uma aula que ja avaliou nao comemora de novo.

            Fica FORA do bloco com `animacao-surgir`: aquela classe anima
            `transform`, e um elemento `fixed` dentro de algo com transform
            passa a se posicionar pelo bloco, nao pela tela — os confetes
            ficariam presos dentro do cartao. */}
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
              ? "Obrigado pela sua resposta!"
              : "Você já avaliou esta aula"}
          </h2>
          <p className="mx-auto mt-5 max-w-lg text-[1.15rem] leading-relaxed text-tinta-suave">
            {enviouAgora
              ? "Sua opinião ajuda a melhorar as próximas aulas. Até o próximo encontro!"
              : "Sua resposta já foi registrada. Obrigado por participar!"}
          </p>
          {aula && (
            <p className="mt-6 text-[1.05rem] font-semibold text-tinta">
              Aula {aula.numero} — {aula.tema}
            </p>
          )}
        </div>
      </>
    );
  }

  if (etapa === "avaliar" && aula) {
    return (
      <div className="animacao-surgir">
        <div className="rounded-2xl border-2 border-marca-200 bg-marca-50 p-6">
          <p className="text-[1.15rem] font-extrabold text-marca-900">
            Olá{primeiroNome ? `, ${primeiroNome}` : ""}!
          </p>
          <p className="mt-2 text-[1.05rem] text-tinta">
            Aula {aula.numero} de {totalDeAulas} —{" "}
            <strong className="font-extrabold">{aula.tema}</strong>
          </p>
        </div>

        <h2
          ref={titulo}
          tabIndex={-1}
          className="mt-9 text-[1.6rem] leading-tight font-extrabold text-marca-900 outline-none"
        >
          Avalie a aula de hoje
        </h2>

        <form onSubmit={enviar} noValidate className="mt-6 space-y-7">
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

          <EscalaRostos
            valor={nota}
            aoEscolher={setNota}
            desabilitado={ocupado}
            erro={erroNota}
          />

          <div className="space-y-2">
            <label
              htmlFor="comentario"
              className="block text-[1.15rem] font-extrabold text-tinta"
            >
              Quer escrever alguma coisa?
            </label>
            <p id="comentario-ajuda" className="text-[1rem] text-tinta-suave">
              É opcional. Conte o que gostou ou o que podemos melhorar.
            </p>
            <textarea
              id="comentario"
              rows={5}
              value={comentario}
              disabled={ocupado}
              aria-describedby="comentario-ajuda comentario-contador"
              aria-invalid={excedeu ? true : undefined}
              onChange={(e) => setComentario(e.target.value)}
              className={`w-full rounded-xl border-2 bg-white px-4 py-4 text-[1.15rem] text-tinta ${
                excedeu ? "border-erro-600 bg-erro-50" : "border-borda"
              }`}
            />
            <p
              id="comentario-contador"
              aria-live="polite"
              className={`text-[1rem] font-semibold ${
                excedeu ? "text-erro-700" : "text-tinta-suave"
              }`}
            >
              {excedeu
                ? `Passou de ${LIMITE_DE_PALAVRAS} palavras. Tire ${palavras - LIMITE_DE_PALAVRAS}.`
                : `${palavras} de ${LIMITE_DE_PALAVRAS} palavras`}
            </p>
          </div>

          <button
            type="submit"
            disabled={ocupado || excedeu}
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
                ENVIAR AVALIAÇÃO
                <Icone nome="seta" className="h-7 w-7" />
              </>
            )}
          </button>

          <p className="text-center text-[1rem] leading-relaxed text-tinta-suave">
            Sua resposta vai <strong>com o seu nome</strong> para a organização
            da oficina. Pode escrever com sinceridade: serve para melhorar as
            próximas aulas.
          </p>
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
        rotulo="Código da aula"
        ajuda="São 4 números, mostrados na tela da sala."
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
