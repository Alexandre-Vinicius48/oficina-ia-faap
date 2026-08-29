"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Campo } from "@/components/Campo";
import { Icone } from "@/components/Icones";
import { supabaseNavegador } from "@/lib/supabase/navegador";

export function FormularioLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [entrando, setEntrando] = useState(false);

  async function entrar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (entrando) return;

    setErro(null);

    if (!email.trim() || !senha) {
      setErro("Preencha o e-mail e a senha.");
      return;
    }

    setEntrando(true);
    const supabase = supabaseNavegador();

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password: senha,
      });

      if (error) {
        // A biblioteca do Supabase devolve erro tanto para senha errada
        // quanto para falha de rede. Sao problemas diferentes e a pessoa
        // precisa saber qual e o dela.
        const semConexao =
          error.name === "AuthRetryableFetchError" || !error.status;

        setErro(
          semConexao
            ? "Não foi possível entrar. Verifique sua conexão e tente novamente."
            : // Mensagem unica de proposito: nao revelamos se o e-mail existe.
              "E-mail ou senha incorretos.",
        );
        setEntrando(false);
        return;
      }

      // A sessao existe, mas ainda falta conferir se esta conta e
      // administradora. Quem responde isso e o servidor.
      const resposta = await fetch("/api/admin/perfil", { cache: "no-store" });

      if (!resposta.ok) {
        await supabase.auth.signOut();
        setErro(
          "Esta conta não tem permissão para acessar o painel da oficina.",
        );
        setEntrando(false);
        return;
      }

      router.replace("/admin/dashboard");
      router.refresh();
    } catch {
      setErro("Não foi possível entrar. Verifique sua conexão e tente novamente.");
      setEntrando(false);
    }
  }

  return (
    <form onSubmit={entrar} noValidate className="space-y-6">
      {erro && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-2xl border-2 border-erro-600 bg-erro-50 p-5"
        >
          <span className="mt-1 shrink-0 text-erro-700">
            <Icone nome="alerta" className="h-7 w-7" />
          </span>
          <p className="text-[1.05rem] font-bold text-erro-700">{erro}</p>
        </div>
      )}

      <Campo
        id="email"
        rotulo="E-mail"
        type="email"
        placeholder="responsavel@email.com"
        autoComplete="email"
        value={email}
        disabled={entrando}
        onChange={(e) => setEmail(e.target.value)}
      />

      <div className="space-y-2">
        <Campo
          id="senha"
          rotulo="Senha"
          type={mostrarSenha ? "text" : "password"}
          placeholder="Digite sua senha"
          autoComplete="current-password"
          value={senha}
          disabled={entrando}
          onChange={(e) => setSenha(e.target.value)}
        />
        <button
          type="button"
          onClick={() => setMostrarSenha((v) => !v)}
          aria-pressed={mostrarSenha}
          className="flex items-center gap-2 text-[1.05rem] font-bold text-marca-700 underline underline-offset-4"
        >
          <Icone
            nome={mostrarSenha ? "olhoFechado" : "olho"}
            className="h-6 w-6"
          />
          {mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
        </button>
      </div>

      <button
        type="submit"
        disabled={entrando}
        aria-busy={entrando}
        className="flex w-full items-center justify-center gap-3 rounded-2xl bg-marca-700 px-8 py-5 text-[1.2rem] font-extrabold text-white shadow-lg transition hover:bg-marca-900 disabled:cursor-not-allowed disabled:bg-tinta-suave"
      >
        {entrando ? (
          <>
            <span
              className="h-6 w-6 animate-spin rounded-full border-4 border-white/40 border-t-white"
              aria-hidden="true"
            />
            Entrando...
          </>
        ) : (
          "ENTRAR"
        )}
      </button>
    </form>
  );
}
