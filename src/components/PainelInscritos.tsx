"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Icone } from "@/components/Icones";
import { DialogoConfirmacao } from "@/components/DialogoConfirmacao";
import { supabaseNavegador } from "@/lib/supabase/navegador";
import { NOME_ARQUIVO_EXCEL } from "@/config/oficina";
import { formatarData, formatarHora, mascararCelular } from "@/lib/format";

type Inscrito = {
  id: string;
  nome_completo: string;
  cpf: string;
  rg: string;
  celular: string;
  email: string;
  data_inscricao: string;
};

type Resposta = {
  itens: Inscrito[];
  total: number;
  hoje: number;
  pagina: number;
  porPagina: number;
  totalPaginas: number;
};

const VAZIO: Resposta = {
  itens: [],
  total: 0,
  hoje: 0,
  pagina: 1,
  porPagina: 25,
  totalPaginas: 1,
};

export function PainelInscritos({ nomeAdmin }: { nomeAdmin: string }) {
  const router = useRouter();

  const [busca, setBusca] = useState("");
  const [pagina, setPagina] = useState(1);
  const [completo, setCompleto] = useState(false);
  const [dados, setDados] = useState<Resposta>(VAZIO);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [baixando, setBaixando] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);

  // Inscrito escolhido para exclusao. Enquanto for null, a janela fica fechada.
  const [paraExcluir, setParaExcluir] = useState<Inscrito | null>(null);
  const [excluindo, setExcluindo] = useState(false);

  const requisicaoAtual = useRef(0);

  const carregar = useCallback(
    async (termo: string, pag: number, verCompleto: boolean) => {
      const marca = ++requisicaoAtual.current;
      setCarregando(true);
      setErro(null);

      try {
        const resposta = await fetch("/api/admin/inscricoes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          cache: "no-store",
          // A busca vai no corpo: nunca aparece na barra de endereços.
          body: JSON.stringify({ busca: termo, pagina: pag, completo: verCompleto }),
        });

        if (marca !== requisicaoAtual.current) return; // resposta antiga

        if (resposta.status === 401 || resposta.status === 403) {
          router.replace("/admin");
          return;
        }

        if (!resposta.ok) {
          setErro("Não foi possível carregar a lista de inscritos.");
          return;
        }

        setDados((await resposta.json()) as Resposta);
      } catch {
        if (marca === requisicaoAtual.current) {
          setErro("Sem conexão com a internet. Tente novamente.");
        }
      } finally {
        if (marca === requisicaoAtual.current) setCarregando(false);
      }
    },
    [router],
  );

  // Busca com pequeno atraso, para não consultar a cada tecla digitada.
  useEffect(() => {
    const tempo = setTimeout(() => {
      void carregar(busca, pagina, completo);
    }, 350);
    return () => clearTimeout(tempo);
  }, [busca, pagina, completo, carregar]);

  async function baixarExcel() {
    if (baixando) return;
    setBaixando(true);
    setAviso(null);

    try {
      const resposta = await fetch("/api/admin/exportar", { cache: "no-store" });

      if (resposta.status === 401 || resposta.status === 403) {
        router.replace("/admin");
        return;
      }
      if (!resposta.ok) {
        setAviso("Não foi possível gerar a planilha. Tente novamente.");
        return;
      }

      const arquivo = await resposta.blob();
      const endereco = URL.createObjectURL(arquivo);
      const link = document.createElement("a");
      link.href = endereco;
      link.download = NOME_ARQUIVO_EXCEL;
      document.body.appendChild(link);
      link.click();
      link.remove();
      // Libera a memoria so depois que o navegador comecou a baixar.
      // Liberar na mesma hora faz o download falhar em alguns navegadores.
      setTimeout(() => URL.revokeObjectURL(endereco), 10_000);
      setAviso("Planilha baixada com sucesso.");
    } catch {
      setAviso("Não foi possível baixar a planilha. Verifique sua conexão.");
    } finally {
      setBaixando(false);
    }
  }

  async function confirmarExclusao() {
    if (!paraExcluir || excluindo) return;

    setExcluindo(true);
    setAviso(null);

    try {
      const resposta = await fetch("/api/admin/inscricoes/excluir", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({ id: paraExcluir.id }),
      });

      if (resposta.status === 401 || resposta.status === 403) {
        router.replace("/admin");
        return;
      }

      if (!resposta.ok) {
        const corpo: { erro?: string } = await resposta.json().catch(() => ({}));
        setAviso(corpo.erro ?? "Não foi possível excluir a inscrição.");
        return;
      }

      const nome = paraExcluir.nome_completo;
      setParaExcluir(null);
      setAviso(`Inscrição de ${nome} excluída.`);

      // Recarrega a lista. Se a página tiver ficado vazia, volta uma página.
      const paginaAlvo =
        dados.itens.length === 1 && pagina > 1 ? pagina - 1 : pagina;
      if (paginaAlvo !== pagina) setPagina(paginaAlvo);
      else await carregar(busca, pagina, completo);
    } catch {
      setAviso("Sem conexão com a internet. Tente novamente.");
    } finally {
      setExcluindo(false);
    }
  }

  async function sair() {
    await supabaseNavegador().auth.signOut();
    router.replace("/admin");
    router.refresh();
  }

  const primeiroDaPagina = (dados.pagina - 1) * dados.porPagina + 1;
  const ultimoDaPagina = Math.min(dados.pagina * dados.porPagina, dados.total);

  return (
    <div className="space-y-8">
      {/* ---------------- Cartões de números ---------------- */}
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="rounded-2xl border-2 border-borda bg-white p-6 shadow-sm">
          <p className="flex items-center gap-2 text-[1rem] font-bold tracking-wide text-tinta-suave uppercase">
            <Icone nome="pessoas" className="h-6 w-6 text-marca-600" />
            Total de inscritos
          </p>
          <p className="mt-2 text-[3rem] leading-none font-extrabold text-marca-900">
            {dados.total}
          </p>
        </div>
        <div className="rounded-2xl border-2 border-borda bg-white p-6 shadow-sm">
          <p className="flex items-center gap-2 text-[1rem] font-bold tracking-wide text-tinta-suave uppercase">
            <Icone nome="calendario" className="h-6 w-6 text-acolhe-600" />
            Inscritos hoje
          </p>
          <p className="mt-2 text-[3rem] leading-none font-extrabold text-acolhe-700">
            {dados.hoje}
          </p>
        </div>
      </div>

      {/* ---------------- Ações ---------------- */}
      <div className="rounded-2xl border-2 border-borda bg-white p-6 shadow-sm">
        <div className="space-y-2">
          <label
            htmlFor="busca"
            className="block text-[1.1rem] font-extrabold text-tinta"
          >
            Pesquisar inscritos
          </label>
          <p id="busca-ajuda" className="text-[1rem] text-tinta-suave">
            Digite nome, CPF, celular ou e-mail.
          </p>
          <div className="relative">
            <span className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-tinta-suave">
              <Icone nome="lupa" className="h-6 w-6" />
            </span>
            <input
              id="busca"
              type="search"
              value={busca}
              aria-describedby="busca-ajuda"
              placeholder="Pesquisar..."
              onChange={(e) => {
                setBusca(e.target.value);
                setPagina(1);
              }}
              className="w-full rounded-xl border-2 border-borda bg-white py-4 pr-4 pl-13 text-[1.15rem] text-tinta"
            />
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:flex-wrap">
          <button
            type="button"
            onClick={baixarExcel}
            disabled={baixando}
            aria-busy={baixando}
            className="flex flex-1 items-center justify-center gap-3 rounded-2xl bg-sucesso-700 px-6 py-4 text-[1.15rem] font-extrabold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:bg-tinta-suave"
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
                BAIXAR LISTA DE INSCRITOS
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => setCompleto((v) => !v)}
            aria-pressed={completo}
            className="flex flex-1 items-center justify-center gap-3 rounded-2xl border-2 border-marca-600 bg-white px-6 py-4 text-[1.1rem] font-extrabold text-marca-700 transition hover:bg-marca-50"
          >
            <Icone
              nome={completo ? "olhoFechado" : "olho"}
              className="h-6 w-6"
            />
            {completo ? "Ocultar CPF e RG" : "Mostrar CPF e RG"}
          </button>

          <button
            type="button"
            onClick={sair}
            className="flex items-center justify-center gap-3 rounded-2xl border-2 border-borda bg-white px-6 py-4 text-[1.1rem] font-extrabold text-tinta transition hover:bg-papel"
          >
            <Icone nome="sair" className="h-6 w-6" />
            SAIR
          </button>
        </div>

        {completo && (
          <p className="mt-4 rounded-xl bg-acolhe-50 p-4 text-[1rem] font-semibold text-acolhe-700">
            Documentos completos visíveis na tela. Cuidado com quem está por
            perto e volte a ocultar quando terminar.
          </p>
        )}

        {aviso && (
          <p role="status" className="mt-4 text-[1.05rem] font-bold text-sucesso-700">
            {aviso}
          </p>
        )}
      </div>

      {/* ---------------- Lista ---------------- */}
      <section aria-labelledby="titulo-lista">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="titulo-lista" className="text-[1.4rem] font-extrabold text-marca-900">
            Inscritos
          </h2>
          <p aria-live="polite" className="text-[1rem] text-tinta-suave">
            {carregando
              ? "Carregando..."
              : dados.total === 0
                ? "Nenhum inscrito encontrado."
                : `Mostrando ${primeiroDaPagina} a ${ultimoDaPagina} de ${dados.total}`}
          </p>
        </div>

        {erro && (
          <p
            role="alert"
            className="mt-4 rounded-2xl border-2 border-erro-600 bg-erro-50 p-5 text-[1.05rem] font-bold text-erro-700"
          >
            {erro}
          </p>
        )}

        {/* Celular: cada inscrito vira um cartão. */}
        <ul className="mt-5 space-y-4 lg:hidden">
          {dados.itens.map((item) => (
            <li
              key={item.id}
              className="rounded-2xl border-2 border-borda bg-white p-5 shadow-sm"
            >
              <p className="text-[1.15rem] font-extrabold text-tinta">
                {item.nome_completo}
              </p>
              <dl className="mt-3 space-y-2 text-[1.02rem]">
                <div className="flex gap-2">
                  <dt className="font-bold text-tinta-suave">CPF:</dt>
                  <dd className="font-mono text-tinta">{item.cpf}</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="font-bold text-tinta-suave">RG:</dt>
                  <dd className="font-mono text-tinta">{item.rg}</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="font-bold text-tinta-suave">Celular:</dt>
                  <dd className="text-tinta">{mascararCelular(item.celular)}</dd>
                </div>
                <div className="flex flex-wrap gap-2">
                  <dt className="font-bold text-tinta-suave">E-mail:</dt>
                  <dd className="break-all text-tinta">{item.email}</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="font-bold text-tinta-suave">Inscrição:</dt>
                  <dd className="text-tinta">
                    {formatarData(item.data_inscricao)} às{" "}
                    {formatarHora(item.data_inscricao)}
                  </dd>
                </div>
              </dl>

              <button
                type="button"
                onClick={() => setParaExcluir(item)}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-erro-600 bg-white px-5 py-3 text-[1.02rem] font-extrabold text-erro-700 transition hover:bg-erro-50"
              >
                <Icone nome="lixeira" className="h-6 w-6" />
                Excluir inscrição
              </button>
            </li>
          ))}
        </ul>

        {/* Telas grandes: tabela. */}
        <div className="mt-5 hidden overflow-x-auto rounded-2xl border-2 border-borda bg-white shadow-sm lg:block">
          <table className="w-full border-collapse text-left text-[1.02rem]">
            <caption className="sr-only">
              Lista de inscritos na oficina, da inscrição mais recente para a
              mais antiga.
            </caption>
            <thead>
              <tr className="bg-marca-50">
                {["Nome", "CPF", "RG", "Celular", "E-mail", "Data"].map((titulo) => (
                  <th
                    key={titulo}
                    scope="col"
                    className="border-b-2 border-borda px-4 py-4 font-extrabold text-marca-900"
                  >
                    {titulo}
                  </th>
                ))}
                <th scope="col" className="border-b-2 border-borda px-4 py-4">
                  <span className="sr-only">Ações</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {dados.itens.map((item) => (
                <tr key={item.id} className="border-b border-borda last:border-0">
                  <th
                    scope="row"
                    className="px-4 py-4 text-left font-bold text-tinta"
                  >
                    {item.nome_completo}
                  </th>
                  <td className="px-4 py-4 font-mono whitespace-nowrap text-tinta">
                    {item.cpf}
                  </td>
                  <td className="px-4 py-4 font-mono whitespace-nowrap text-tinta">
                    {item.rg}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-tinta">
                    {mascararCelular(item.celular)}
                  </td>
                  <td className="px-4 py-4 break-all text-tinta">{item.email}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-tinta">
                    {formatarData(item.data_inscricao)}
                  </td>
                  <td className="px-4 py-4">
                    <button
                      type="button"
                      onClick={() => setParaExcluir(item)}
                      aria-label={`Excluir a inscrição de ${item.nome_completo}`}
                      title="Excluir inscrição"
                      className="flex h-12 w-12 items-center justify-center rounded-xl border-2 border-borda bg-white text-erro-700 transition hover:border-erro-600 hover:bg-erro-50"
                    >
                      <Icone nome="lixeira" className="h-6 w-6" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {!carregando && dados.itens.length === 0 && (
            <p className="px-4 py-10 text-center text-[1.1rem] text-tinta-suave">
              Nenhum inscrito encontrado.
            </p>
          )}
        </div>

        {/* ---------------- Paginação ---------------- */}
        {dados.totalPaginas > 1 && (
          <nav
            aria-label="Navegação entre páginas"
            className="mt-7 flex items-center justify-between gap-4"
          >
            <button
              type="button"
              onClick={() => setPagina((p) => Math.max(1, p - 1))}
              disabled={dados.pagina <= 1}
              className="rounded-2xl border-2 border-borda bg-white px-6 py-4 text-[1.05rem] font-extrabold text-tinta disabled:opacity-45"
            >
              ← Anterior
            </button>
            <p className="text-[1.05rem] font-bold text-tinta">
              Página {dados.pagina} de {dados.totalPaginas}
            </p>
            <button
              type="button"
              onClick={() =>
                setPagina((p) => Math.min(dados.totalPaginas, p + 1))
              }
              disabled={dados.pagina >= dados.totalPaginas}
              className="rounded-2xl border-2 border-borda bg-white px-6 py-4 text-[1.05rem] font-extrabold text-tinta disabled:opacity-45"
            >
              Próxima →
            </button>
          </nav>
        )}
      </section>

      <p className="text-[0.98rem] text-tinta-suave">
        Você está no painel como <strong className="text-tinta">{nomeAdmin}</strong>.
      </p>

      <DialogoConfirmacao
        aberto={paraExcluir !== null}
        titulo="Excluir esta inscrição?"
        descricao="A inscrição será apagada do banco de dados definitivamente. Não é possível desfazer."
        detalhe={paraExcluir?.nome_completo}
        textoConfirmar="Sim, excluir"
        processando={excluindo}
        aoConfirmar={confirmarExclusao}
        aoCancelar={() => {
          if (!excluindo) setParaExcluir(null);
        }}
      />
    </div>
  );
}
