"use client";

import { useState } from "react";
import { Icone } from "@/components/Icones";
import { ROSTOS } from "@/lib/escala";
import { ESCALA_PESQUISA } from "@/lib/pesquisa";
import type { DadosDashboard, ResumoPergunta } from "@/lib/consulta-dashboard";

/**
 * O DASHBOARD DA OFICINA.
 *
 * Tres abas: os dois conjuntos de dados juntos, e cada um separado — foi
 * assim que a organizacao pediu, e faz sentido: a avaliacao de aula mede o
 * dia a dia, o questionario final mede o todo, e so a visao geral responde
 * "como foi a oficina?".
 *
 * Os graficos sao desenhados com caixas e larguras em porcentagem, sem
 * nenhuma biblioteca de grafico. Tres motivos: a politica de seguranca do
 * site nao deixa carregar script de fora; uma biblioteca de grafico pesa
 * mais do que a pagina inteira; e todo numero aparece escrito ao lado da
 * barra, entao quem usa leitor de tela nao depende do desenho.
 */

type Aba = "geral" | "aulas" | "pesquisa";

/* ------------------------------ pecinhas ------------------------------ */

function Cartao({
  rotulo,
  valor,
  detalhe,
  destaque = false,
}: {
  rotulo: string;
  valor: string;
  detalhe?: string;
  destaque?: boolean;
}) {
  return (
    <div
      className={`rounded-3xl border-2 p-5 ${
        destaque ? "border-acolhe-600 bg-acolhe-50" : "border-borda bg-white"
      }`}
    >
      <p className="text-[0.95rem] leading-snug font-bold tracking-wide text-tinta-suave uppercase">
        {rotulo}
      </p>
      <p
        className={`fonte-titulo mt-2 text-[2.4rem] leading-none font-extrabold ${
          destaque ? "text-acolhe-800" : "text-marca-900"
        }`}
      >
        {valor}
      </p>
      {detalhe && (
        <p className="mt-2 text-[1rem] leading-snug text-tinta-suave">{detalhe}</p>
      )}
    </div>
  );
}

/** Uma barra horizontal simples, com o rótulo à esquerda e o número à direita. */
function Barra({
  rotulo,
  quantos,
  maior,
  cor,
}: {
  rotulo: string;
  quantos: number;
  maior: number;
  cor: string;
}) {
  return (
    <li className="flex items-center gap-3">
      <span className="w-28 shrink-0 text-[0.98rem] leading-tight font-bold text-tinta-suave">
        {rotulo}
      </span>
      <span className="h-6 flex-1 overflow-hidden rounded-full bg-papel-alt">
        <span
          className="block h-full rounded-full transition-[width]"
          style={{
            width: `${maior > 0 ? (quantos / maior) * 100 : 0}%`,
            backgroundColor: cor,
          }}
        />
      </span>
      <span className="w-8 shrink-0 text-right text-[1.02rem] font-extrabold text-tinta">
        {quantos}
      </span>
    </li>
  );
}

/**
 * A barra empilhada de uma afirmacao do questionario.
 *
 * Cada pedaco e uma alternativa, com largura proporcional a quantas pessoas
 * a marcaram. E a forma classica de mostrar escala Likert: da para comparar
 * perguntas de relance, porque todas as barras tem a mesma largura total.
 */
function BarraEmpilhada({ pergunta }: { pergunta: ResumoPergunta }) {
  const total = pergunta.total;

  return (
    <div className="space-y-2">
      <p className="flex gap-3 text-[1.02rem] leading-snug font-semibold text-tinta">
        <span
          aria-hidden="true"
          className="fonte-titulo mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-marca-50 text-[0.8rem] font-extrabold text-marca-800"
        >
          {pergunta.numero}
        </span>
        <span>{pergunta.texto}</span>
      </p>

      {total === 0 ? (
        <p className="text-[0.98rem] text-tinta-suave italic">
          Ninguém respondeu a esta pergunta ainda.
        </p>
      ) : (
        <>
          <div className="flex h-7 w-full overflow-hidden rounded-full bg-papel-alt">
            {ESCALA_PESQUISA.map((opcao, i) => {
              const quantos = pergunta.contagens[i] ?? 0;
              if (quantos === 0) return null;
              return (
                <span
                  key={opcao.valor}
                  title={`${opcao.rotulo}: ${quantos}`}
                  className="h-full"
                  style={{
                    width: `${(quantos / total) * 100}%`,
                    backgroundColor: opcao.cor,
                  }}
                />
              );
            })}
          </div>

          {/* Os mesmos números por escrito: a barra é o atalho visual, não a
              única forma de ler o resultado. */}
          <p className="text-[0.95rem] leading-snug text-tinta-suave">
            {pergunta.concordancia !== null && (
              <strong className="font-extrabold text-sucesso-700">
                {pergunta.concordancia}% concordam
              </strong>
            )}
            {pergunta.media !== null && <> · média {pergunta.media} de 5</>} ·{" "}
            {total} {total === 1 ? "resposta" : "respostas"}
            {ESCALA_PESQUISA.map((opcao, i) => {
              const quantos = pergunta.contagens[i] ?? 0;
              if (quantos === 0) return null;
              return (
                <span key={opcao.valor}>
                  {" · "}
                  {opcao.curto}: {quantos}
                </span>
              );
            })}
          </p>
        </>
      )}
    </div>
  );
}

function Legenda() {
  return (
    <ul className="flex flex-wrap gap-x-5 gap-y-2">
      {ESCALA_PESQUISA.map((opcao) => (
        <li
          key={opcao.valor}
          className="flex items-center gap-2 text-[0.98rem] font-semibold text-tinta"
        >
          <span
            aria-hidden="true"
            className="h-4 w-4 shrink-0 rounded-sm"
            style={{ backgroundColor: opcao.cor }}
          />
          {opcao.rotulo}
        </li>
      ))}
    </ul>
  );
}

function SemDados({ texto }: { texto: string }) {
  return (
    <p className="rounded-3xl border-2 border-dashed border-borda bg-white p-8 text-center text-[1.1rem] text-tinta-suave">
      {texto}
    </p>
  );
}

/** 2026-10-05 -> 05/10 */
function diaEMes(data: string): string {
  const [, mes, dia] = data.split("-");
  return mes && dia ? `${dia}/${mes}` : data;
}

/* ------------------------------ as abas ------------------------------ */

function BlocoAulas({ dados }: { dados: DadosDashboard }) {
  const comResposta = dados.aulas.filter((a) => a.total > 0);

  if (comResposta.length === 0) {
    return <SemDados texto="Nenhuma aula foi avaliada ainda." />;
  }

  const maiorMedia = ROSTOS.length;

  return (
    <div className="space-y-8">
      {/* Comparação entre as aulas */}
      <div className="rounded-3xl border-2 border-borda bg-white p-6">
        <h3 className="text-[1.2rem] font-extrabold text-marca-900">
          Média de cada encontro
        </h3>
        <p className="mt-1 text-[1rem] text-tinta-suave">
          De 1 (Ruim) a {maiorMedia} (Muito bom).
        </p>

        <div className="mt-6 flex items-end gap-4 sm:gap-8">
          {dados.aulas.map((aula) => {
            const altura = aula.media ? (aula.media / maiorMedia) * 100 : 0;
            return (
              <div key={aula.numero} className="flex flex-1 flex-col items-center">
                <span className="mb-2 text-[1.05rem] font-extrabold text-tinta">
                  {aula.media ?? "—"}
                </span>
                <span className="flex h-40 w-full items-end overflow-hidden rounded-t-xl bg-papel-alt">
                  <span
                    className="w-full rounded-t-xl bg-marca-600"
                    style={{ height: `${altura}%` }}
                  />
                </span>
                <span className="mt-2 text-center text-[0.95rem] leading-tight font-bold text-tinta">
                  Aula {aula.numero}
                </span>
                <span className="text-center text-[0.9rem] text-tinta-suave">
                  {diaEMes(aula.data)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Uma caixa por aula */}
      <div className="grid gap-6 lg:grid-cols-2">
        {dados.aulas.map((aula) => {
          const maior = Math.max(1, ...aula.distribuicao);
          return (
            <div
              key={aula.numero}
              className="rounded-3xl border-2 border-borda bg-white p-6"
            >
              <p className="text-[1.1rem] font-extrabold text-tinta">
                Aula {aula.numero} — {aula.tema}
              </p>
              <p className="mt-1 text-[1rem] text-tinta-suave">
                {aula.total} {aula.total === 1 ? "resposta" : "respostas"}
                {aula.media !== null && <> · média {aula.media} de {maiorMedia}</>}
                {aula.comentarios > 0 && (
                  <>
                    {" · "}
                    {aula.comentarios}{" "}
                    {aula.comentarios === 1 ? "comentário" : "comentários"}
                  </>
                )}
              </p>

              {aula.total === 0 ? (
                <p className="mt-4 text-[1rem] text-tinta-suave italic">
                  Nenhuma resposta nesta aula.
                </p>
              ) : (
                <ul className="mt-5 space-y-2">
                  {ROSTOS.map((rosto, i) => (
                    <Barra
                      key={rosto.nota}
                      rotulo={rosto.rotulo}
                      quantos={aula.distribuicao[i] ?? 0}
                      maior={maior}
                      cor={rosto.cor}
                    />
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function BlocoPesquisa({ dados }: { dados: DadosDashboard }) {
  const { pesquisa } = dados;

  if (pesquisa.respostas === 0) {
    return (
      <SemDados texto="Ninguém respondeu ao questionário final ainda. Libere o questionário no painel para começar a receber respostas." />
    );
  }

  return (
    <div className="space-y-8">
      <div className="rounded-3xl border-2 border-borda bg-white p-6">
        <h3 className="text-[1.2rem] font-extrabold text-marca-900">
          Como ler os gráficos
        </h3>
        <p className="mt-1 mb-4 text-[1rem] text-tinta-suave">
          Cada barra é uma afirmação. O tamanho de cada cor mostra quantas
          pessoas escolheram aquela alternativa.
        </p>
        <Legenda />
      </div>

      {/* Comparação entre as seções */}
      <div className="rounded-3xl border-2 border-borda bg-white p-6">
        <h3 className="text-[1.2rem] font-extrabold text-marca-900">
          Concordância por assunto
        </h3>
        <p className="mt-1 text-[1rem] text-tinta-suave">
          Quantos, entre quem opinou, marcaram “Concordo” ou “Concordo
          totalmente”.
        </p>
        <ul className="mt-5 space-y-3">
          {pesquisa.secoes.map((secao) => (
            <li
              key={secao.titulo}
              className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3"
            >
              <span className="text-[0.98rem] leading-tight font-bold text-tinta sm:w-64 sm:shrink-0">
                {secao.titulo}
              </span>
              <span className="flex items-center gap-3 sm:flex-1">
                <span className="h-6 flex-1 overflow-hidden rounded-full bg-papel-alt">
                  <span
                    className="block h-full rounded-full bg-sucesso-700"
                    style={{ width: `${secao.concordancia ?? 0}%` }}
                  />
                </span>
                <span className="w-14 shrink-0 text-right text-[1.02rem] font-extrabold text-tinta">
                  {secao.concordancia === null ? "—" : `${secao.concordancia}%`}
                </span>
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* Pergunta a pergunta, agrupadas por seção */}
      {pesquisa.secoes.map((secao) => (
        <div
          key={secao.titulo}
          className="rounded-3xl border-2 border-borda bg-white p-6"
        >
          <h3 className="text-[1.2rem] leading-tight font-extrabold text-marca-900">
            {secao.titulo}
          </h3>
          {secao.media !== null && (
            <p className="mt-1 text-[1rem] text-tinta-suave">
              Média do assunto: {secao.media} de 5
            </p>
          )}
          <div className="mt-6 space-y-6">
            {secao.perguntas.map((pergunta) => (
              <BarraEmpilhada key={pergunta.chave} pergunta={pergunta} />
            ))}
          </div>
        </div>
      ))}

      {/* O que foi escrito à mão */}
      {pesquisa.textos.length > 0 && (
        <div className="rounded-3xl border-2 border-borda bg-white p-6">
          <h3 className="text-[1.2rem] font-extrabold text-marca-900">
            O que escreveram
          </h3>
          <ul className="mt-5 space-y-4">
            {pesquisa.textos.map((t, i) => (
              <li
                key={`${t.nome}-${t.coluna}-${i}`}
                className="rounded-2xl border-2 border-borda bg-papel-alt p-4"
              >
                <p className="text-[0.95rem] font-bold text-tinta-suave">
                  {t.pergunta}
                </p>
                <p className="mt-1 text-[1.05rem] leading-relaxed text-tinta">
                  “{t.texto}”
                </p>
                <p className="mt-2 text-[0.95rem] font-extrabold text-tinta">
                  {t.nome}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function BlocoGeral({ dados }: { dados: DadosDashboard }) {
  const { pesquisa } = dados;
  const satisfacao = pesquisa.satisfacaoGeral;

  return (
    <div className="space-y-8">
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <Cartao
          rotulo="Inscritos"
          valor={String(dados.inscritos)}
          detalhe="pessoas no cadastro"
        />
        <Cartao
          rotulo="Avaliações de aula"
          valor={String(dados.totalDeAvaliacoes)}
          detalhe={`de ${dados.quantosAvaliaramAlgumaAula} ${
            dados.quantosAvaliaramAlgumaAula === 1 ? "pessoa" : "pessoas"
          } diferentes`}
        />
        <Cartao
          rotulo="Média das aulas"
          valor={
            dados.mediaGeralDasAulas === null
              ? "—"
              : String(dados.mediaGeralDasAulas)
          }
          detalhe={`de ${ROSTOS.length}, somando os quatro encontros`}
        />
        <Cartao
          rotulo="Questionário final"
          valor={String(pesquisa.respostas)}
          detalhe={`${
            pesquisa.respostas === 1 ? "pessoa respondeu" : "pessoas responderam"
          }`}
        />
      </div>

      {pesquisa.respostas > 0 && (
        <div className="grid gap-5 sm:grid-cols-2">
          <Cartao
            destaque
            rotulo="Satisfação geral com a oficina"
            valor={
              satisfacao?.concordancia === null ||
              satisfacao?.concordancia === undefined
                ? "—"
                : `${satisfacao.concordancia}%`
            }
            detalhe="disseram que ficaram satisfeitos com a Oficina SabedorIA"
          />
          <Cartao
            destaque
            rotulo="Concordância no questionário"
            valor={
              pesquisa.concordanciaGeral === null
                ? "—"
                : `${pesquisa.concordanciaGeral}%`
            }
            detalhe={`média das ${pesquisa.perguntas.length} afirmações${
              pesquisa.mediaGeral !== null
                ? ` · nota média ${pesquisa.mediaGeral} de 5`
                : ""
            }`}
          />
        </div>
      )}

      {/* Comparação lado a lado: aula a aula e a oficina inteira. */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border-2 border-borda bg-white p-6">
          <h3 className="text-[1.2rem] font-extrabold text-marca-900">
            Avaliação das aulas, dia a dia
          </h3>
          <ul className="mt-5 space-y-3">
            {dados.aulas.map((aula) => (
              <li key={aula.numero} className="flex items-center gap-3">
                <span className="w-24 shrink-0 text-[0.98rem] leading-tight font-bold text-tinta">
                  Aula {aula.numero}
                  <span className="block font-normal text-tinta-suave">
                    {diaEMes(aula.data)}
                  </span>
                </span>
                <span className="h-6 flex-1 overflow-hidden rounded-full bg-papel-alt">
                  <span
                    className="block h-full rounded-full bg-marca-600"
                    style={{
                      width: `${((aula.media ?? 0) / ROSTOS.length) * 100}%`,
                    }}
                  />
                </span>
                <span className="w-20 shrink-0 text-right text-[1rem] font-extrabold text-tinta">
                  {aula.media ?? "—"}
                  <span className="font-normal text-tinta-suave">
                    {" "}
                    ({aula.total})
                  </span>
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-[0.95rem] text-tinta-suave">
            Média de 1 a {ROSTOS.length}. Entre parênteses, quantas pessoas
            responderam.
          </p>
        </div>

        <div className="rounded-3xl border-2 border-borda bg-white p-6">
          <h3 className="text-[1.2rem] font-extrabold text-marca-900">
            Questionário final, por assunto
          </h3>
          {pesquisa.respostas === 0 ? (
            <p className="mt-5 text-[1.05rem] text-tinta-suave italic">
              Ninguém respondeu ao questionário ainda.
            </p>
          ) : (
            <>
              <ul className="mt-5 space-y-3">
                {pesquisa.secoes.map((secao) => (
                  <li
                    key={secao.titulo}
                    className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3"
                  >
                    <span className="text-[0.95rem] leading-tight font-bold text-tinta sm:w-40 sm:shrink-0">
                      {secao.titulo}
                    </span>
                    <span className="flex items-center gap-3 sm:flex-1">
                      <span className="h-6 flex-1 overflow-hidden rounded-full bg-papel-alt">
                        <span
                          className="block h-full rounded-full bg-sucesso-700"
                          style={{ width: `${secao.concordancia ?? 0}%` }}
                        />
                      </span>
                      <span className="w-14 shrink-0 text-right text-[1rem] font-extrabold text-tinta">
                        {secao.concordancia === null
                          ? "—"
                          : `${secao.concordancia}%`}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-[0.95rem] text-tinta-suave">
                Quantos, entre quem opinou, concordaram com as afirmações
                daquele assunto.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------ a tela ------------------------------ */

const ABAS: { id: Aba; rotulo: string; icone: "lupa" | "pessoas" | "escrita" }[] = [
  { id: "geral", rotulo: "Visão geral", icone: "lupa" },
  { id: "aulas", rotulo: "Avaliação das aulas", icone: "pessoas" },
  { id: "pesquisa", rotulo: "Questionário final", icone: "escrita" },
];

export function Dashboard({ dados }: { dados: DadosDashboard }) {
  const [aba, setAba] = useState<Aba>("geral");

  return (
    <div className="space-y-8">
      <div
        role="tablist"
        aria-label="O que mostrar no dashboard"
        className="flex flex-wrap gap-3"
      >
        {ABAS.map((item) => {
          const ativa = aba === item.id;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              id={`aba-${item.id}`}
              aria-selected={ativa}
              aria-controls={`painel-${item.id}`}
              onClick={() => setAba(item.id)}
              className={`flex items-center gap-3 rounded-2xl border-2 px-5 py-3 text-[1.05rem] font-extrabold transition ${
                ativa
                  ? "border-marca-700 bg-marca-700 text-white"
                  : "border-borda bg-white text-tinta hover:bg-papel-alt"
              }`}
            >
              <Icone nome={item.icone} className="h-6 w-6" />
              {item.rotulo}
            </button>
          );
        })}
      </div>

      <div
        role="tabpanel"
        id={`painel-${aba}`}
        aria-labelledby={`aba-${aba}`}
        tabIndex={-1}
        className="outline-none"
      >
        {aba === "geral" && <BlocoGeral dados={dados} />}
        {aba === "aulas" && <BlocoAulas dados={dados} />}
        {aba === "pesquisa" && <BlocoPesquisa dados={dados} />}
      </div>
    </div>
  );
}
