"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Campo } from "@/components/Campo";
import { Icone } from "@/components/Icones";
import { ModalPrivacidade } from "@/components/ModalPrivacidade";
import { mascararCelular, mascararCpf } from "@/lib/format";
import {
  validarFormulario,
  type CamposFormulario,
  type ErrosFormulario,
} from "@/lib/validacao";

const VAZIO: CamposFormulario = {
  nome_completo: "",
  cpf: "",
  rg: "",
  celular: "",
  email: "",
  consentimento_lgpd: false,
};

const ORDEM: (keyof CamposFormulario)[] = [
  "nome_completo",
  "cpf",
  "rg",
  "celular",
  "email",
  "consentimento_lgpd",
];

export function FormularioInscricao() {
  const router = useRouter();

  const [campos, setCampos] = useState<CamposFormulario>(VAZIO);
  const [erros, setErros] = useState<ErrosFormulario>({});
  const [erroGeral, setErroGeral] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [modalAberto, setModalAberto] = useState(false);

  // Armadilha para robôs: um campo invisível que uma pessoa nunca preenche.
  const [armadilha, setArmadilha] = useState("");
  // Cada aumento deste numero pede que o foco va para o primeiro campo com erro.
  const [pedidoDeFoco, setPedidoDeFoco] = useState(0);
  const abertoEm = useRef<number | null>(null);
  const referencias = useRef<Record<string, HTMLElement | null>>({});

  // Marca o instante em que o formulário apareceu na tela. Serve só para
  // perceber envios instantâneos, que são sinal de robô.
  useEffect(() => {
    abertoEm.current = Date.now();
  }, []);

  function atualizar<K extends keyof CamposFormulario>(
    campo: K,
    valor: CamposFormulario[K],
  ) {
    setCampos((atual) => ({ ...atual, [campo]: valor }));
    // Some com o erro assim que a pessoa começa a corrigir.
    setErros((atual) => (atual[campo] ? { ...atual, [campo]: undefined } : atual));
    setErroGeral(null);
  }

  /**
   * Leva o foco ate o primeiro campo com erro.
   *
   * Roda em um efeito, e nao logo apos a validacao, por um motivo pratico:
   * enquanto o envio esta em andamento os campos ficam desabilitados, e o
   * navegador nao consegue focar um campo desabilitado. Esperamos o envio
   * terminar para so entao mover o foco.
   */
  useEffect(() => {
    if (pedidoDeFoco === 0 || enviando) return;
    const primeiro = ORDEM.find((campo) => erros[campo]);
    if (!primeiro) return;
    const elemento = referencias.current[primeiro];
    elemento?.focus();
    elemento?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [pedidoDeFoco, enviando, erros]);

  async function enviar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (enviando) return; // impede o clique duplo

    setErroGeral(null);
    const resultado = validarFormulario(campos);

    if (!resultado.ok || !resultado.dados) {
      setErros(resultado.erros);
      setPedidoDeFoco((n) => n + 1);
      return;
    }

    setErros({});
    setEnviando(true);

    try {
      const resposta = await fetch("/api/inscricoes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...resultado.dados,
          _armadilha: armadilha,
          _tempo:
            abertoEm.current === null ? undefined : Date.now() - abertoEm.current,
        }),
      });

      if (resposta.ok) {
        router.push("/sucesso");
        return;
      }

      const corpo: { erro?: string; campo?: string } = await resposta
        .json()
        .catch(() => ({}));

      if (resposta.status === 409) {
        const mensagem = "Este CPF já possui uma inscrição.";
        setErros({ cpf: mensagem });
        setErroGeral(mensagem);
        setPedidoDeFoco((n) => n + 1);
      } else if (resposta.status === 400 && corpo.campo) {
        const mensagem = corpo.erro ?? "Confira os dados digitados.";
        const chave = corpo.campo as keyof CamposFormulario;
        setErros({ [chave]: mensagem } as ErrosFormulario);
        setPedidoDeFoco((n) => n + 1);
      } else if (resposta.status === 429) {
        setErroGeral(
          corpo.erro ??
            "Recebemos muitas tentativas deste aparelho. Aguarde um minuto e tente novamente.",
        );
      } else {
        setErroGeral("Não conseguimos concluir sua matrícula. Tente novamente.");
      }
    } catch {
      setErroGeral(
        "Não foi possível realizar sua matrícula. Verifique sua conexão e tente novamente.",
      );
    } finally {
      setEnviando(false);
    }
  }

  return (
    <>
      <form onSubmit={enviar} noValidate className="space-y-7">
        {erroGeral && (
          <div
            role="alert"
            className="flex items-start gap-3 rounded-2xl border-2 border-erro-600 bg-erro-50 p-5"
          >
            <span className="mt-1 shrink-0 text-erro-700">
              <Icone nome="alerta" className="h-7 w-7" />
            </span>
            <p className="text-[1.1rem] font-bold text-erro-700">{erroGeral}</p>
          </div>
        )}

        <Campo
          id="nome_completo"
          rotulo="Nome completo"
          placeholder="Digite seu nome completo"
          autoComplete="name"
          inputMode="text"
          maxLength={120}
          value={campos.nome_completo}
          erro={erros.nome_completo}
          disabled={enviando}
          ref={(el) => {
            referencias.current.nome_completo = el;
          }}
          onChange={(e) => atualizar("nome_completo", e.target.value)}
        />

        <Campo
          id="cpf"
          rotulo="CPF"
          ajuda="Somente números. Colocamos os pontos automaticamente."
          placeholder="000.000.000-00"
          inputMode="numeric"
          autoComplete="off"
          maxLength={14}
          value={campos.cpf}
          erro={erros.cpf}
          disabled={enviando}
          ref={(el) => {
            referencias.current.cpf = el;
          }}
          onChange={(e) => atualizar("cpf", mascararCpf(e.target.value))}
        />

        <Campo
          id="rg"
          rotulo="RG"
          placeholder="Digite seu RG"
          autoComplete="off"
          maxLength={20}
          value={campos.rg}
          erro={erros.rg}
          disabled={enviando}
          ref={(el) => {
            referencias.current.rg = el;
          }}
          onChange={(e) => atualizar("rg", e.target.value)}
        />

        <Campo
          id="celular"
          rotulo="Celular / WhatsApp"
          ajuda="Com DDD. Exemplo: (11) 90000-0000"
          placeholder="(00) 00000-0000"
          inputMode="tel"
          autoComplete="tel-national"
          maxLength={16}
          value={campos.celular}
          erro={erros.celular}
          disabled={enviando}
          ref={(el) => {
            referencias.current.celular = el;
          }}
          onChange={(e) => atualizar("celular", mascararCelular(e.target.value))}
        />

        <Campo
          id="email"
          rotulo="E-mail"
          type="email"
          placeholder="seuemail@email.com"
          inputMode="email"
          autoComplete="email"
          maxLength={254}
          value={campos.email}
          erro={erros.email}
          disabled={enviando}
          ref={(el) => {
            referencias.current.email = el;
          }}
          onChange={(e) => atualizar("email", e.target.value)}
        />

        {/* Campo-armadilha: invisível na tela e ignorado por leitores de tela. */}
        <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
          <label htmlFor="sobrenome_confirmacao">Não preencha este campo</label>
          <input
            id="sobrenome_confirmacao"
            name="sobrenome_confirmacao"
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={armadilha}
            onChange={(e) => setArmadilha(e.target.value)}
          />
        </div>

        {/* ------------------ Consentimento LGPD ------------------ */}
        <div
          className={`rounded-2xl border-2 p-5 ${
            erros.consentimento_lgpd
              ? "border-erro-600 bg-erro-50"
              : "border-marca-200 bg-marca-50"
          }`}
        >
          <div className="flex items-start gap-4">
            <input
              id="consentimento_lgpd"
              type="checkbox"
              checked={campos.consentimento_lgpd}
              disabled={enviando}
              ref={(el) => {
                referencias.current.consentimento_lgpd = el;
              }}
              onChange={(e) => atualizar("consentimento_lgpd", e.target.checked)}
              aria-invalid={erros.consentimento_lgpd ? true : undefined}
              aria-describedby={
                erros.consentimento_lgpd ? "consentimento_lgpd-erro" : undefined
              }
              className="mt-1 h-8 w-8 shrink-0 cursor-pointer accent-marca-700"
            />
            <label
              htmlFor="consentimento_lgpd"
              className="cursor-pointer text-[1.1rem] leading-relaxed font-semibold text-tinta"
            >
              Autorizo o uso dos meus dados exclusivamente para minha inscrição e
              organização desta oficina, conforme informado nesta página.
            </label>
          </div>

          <button
            type="button"
            onClick={() => setModalAberto(true)}
            className="mt-4 text-[1.05rem] font-bold text-marca-700 underline underline-offset-4"
          >
            Como utilizaremos seus dados?
          </button>

          {erros.consentimento_lgpd && (
            <p
              id="consentimento_lgpd-erro"
              role="alert"
              className="mt-3 flex items-start gap-2 text-[1.05rem] font-bold text-erro-700"
            >
              <span aria-hidden="true">⚠</span>
              {erros.consentimento_lgpd}
            </p>
          )}
        </div>

        {/* ------------------ Botão de envio ------------------ */}
        <button
          type="submit"
          disabled={enviando}
          aria-busy={enviando}
          className="flex w-full items-center justify-center gap-3 rounded-2xl bg-acolhe-700 px-8 py-5 text-[1.3rem] font-extrabold text-white shadow-lg transition hover:bg-acolhe-800 disabled:cursor-not-allowed disabled:bg-tinta-suave"
        >
          {enviando ? (
            <>
              <span
                className="h-7 w-7 animate-spin rounded-full border-4 border-white/40 border-t-white"
                aria-hidden="true"
              />
              Enviando sua matrícula...
            </>
          ) : (
            <>
              REALIZAR MATRÍCULA
              <Icone nome="seta" className="h-7 w-7" />
            </>
          )}
        </button>

        <p aria-live="polite" className="sr-only">
          {enviando ? "Enviando sua matrícula, aguarde." : ""}
        </p>

        <p className="text-center text-[1rem] text-tinta-suave">
          Os campos marcados com <span className="text-erro-600">*</span> são
          obrigatórios.
        </p>
      </form>

      <ModalPrivacidade
        aberto={modalAberto}
        aoFechar={() => setModalAberto(false)}
      />
    </>
  );
}
