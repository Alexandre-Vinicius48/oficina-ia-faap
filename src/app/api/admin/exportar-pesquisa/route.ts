import ExcelJS from "exceljs";
import { NextResponse } from "next/server";
import { administradorAtual } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { NOME_ARQUIVO_EXCEL_PESQUISA, OFICINA } from "@/config/oficina";
import { formatarData, formatarHora } from "@/lib/format";
import { dentroDoLimite } from "@/lib/limite-requisicoes";
import {
  concordanciaDaPergunta,
  ESCALA_PESQUISA,
  mediaDaPergunta,
  NUMERO_DA_PERGUNTA,
  PERGUNTAS_ABERTAS,
  PERGUNTAS_PESQUISA,
  rotuloDaOpcao,
  SECAO_DA_PERGUNTA,
} from "@/lib/pesquisa";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * PLANILHA DO QUESTIONARIO FINAL.
 *
 * Tres abas, cada uma para um jeito de olhar os mesmos dados:
 *
 *   Resumo por pergunta — uma linha por afirmacao, com media, concordancia
 *                         e quantas pessoas marcaram cada alternativa. E a
 *                         aba que vai para o relatorio.
 *   Respostas           — uma linha por pessoa, uma coluna por pergunta.
 *                         E o formato que o Excel e qualquer programa de
 *                         estatistica esperam para cruzar dados.
 *   Comentarios         — so o que foi escrito a mao, em colunas largas,
 *                         porque texto corrido nao se le numa planilha de
 *                         trinta colunas.
 *
 * Como nas avaliacoes de aula, a planilha traz o NOME de quem respondeu —
 * e so o nome. CPF, celular e e-mail ficam de fora.
 */

type Resposta = {
  inscricao_id: string;
  respostas: Record<string, number> | null;
  mais_gostou: string | null;
  melhorar: string | null;
  como_usar: string | null;
  created_at: string;
};

function json(dados: unknown, status: number) {
  return NextResponse.json(dados, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

function estilizarCabecalho(aba: ExcelJS.Worksheet, numeroDaLinha = 1, altura = 26) {
  const linha = aba.getRow(numeroDaLinha);
  linha.font = { bold: true, size: 12, color: { argb: "FFFFFFFF" } };
  linha.alignment = { vertical: "middle", horizontal: "left", wrapText: true };
  linha.height = altura;
  linha.eachCell((celula) => {
    celula.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF16398A" },
    };
    celula.border = { bottom: { style: "thin", color: { argb: "FF0D2350" } } };
  });
}

export async function GET() {
  const admin = await administradorAtual();
  if (!admin) return json({ erro: "Acesso restrito." }, 403);

  const limite = dentroDoLimite(`admin-export-pesq:${admin.userId}`, 10, 60 * 1000);
  if (!limite.permitido) {
    return json(
      { erro: "Aguarde um instante antes de baixar a planilha novamente." },
      429,
    );
  }

  const supabase = supabaseAdmin();

  const [resRespostas, resInscritos] = await Promise.all([
    supabase
      .from("pesquisa_respostas")
      .select("inscricao_id, respostas, mais_gostou, melhorar, como_usar, created_at")
      .order("created_at", { ascending: true }),
    supabase.from("inscricoes").select("id, nome_completo"),
  ]);

  if (resRespostas.error || resInscritos.error) {
    console.error("[admin] falha ao exportar o questionario", {
      codigo:
        resRespostas.error?.code ?? resInscritos.error?.code ?? "desconhecido",
    });
    return json(
      { erro: "Não foi possível gerar a planilha. Tente novamente." },
      500,
    );
  }

  const nomePor = new Map(
    (resInscritos.data ?? []).map((i) => [
      i.id as string,
      i.nome_completo as string,
    ]),
  );
  const respostas = (resRespostas.data ?? []) as Resposta[];

  const planilha = new ExcelJS.Workbook();
  planilha.creator = `${OFICINA.titulo} - ${OFICINA.subtitulo}`;
  planilha.created = new Date();

  /* ------------------ Aba 1: resumo por pergunta ------------------ */
  const resumo = planilha.addWorksheet("Resumo por pergunta", {
    views: [{ state: "frozen", xSplit: 3, ySplit: 1 }],
  });

  resumo.columns = [
    { header: "Nº", key: "numero", width: 6 },
    { header: "Seção", key: "secao", width: 34 },
    { header: "Pergunta", key: "pergunta", width: 62 },
    { header: "Respostas", key: "total", width: 11 },
    { header: "Média (de 5)", key: "media", width: 14 },
    { header: "% que concorda", key: "concordancia", width: 16 },
    ...ESCALA_PESQUISA.map((o) => ({
      header: o.rotulo,
      key: `o${o.valor}`,
      width: Math.max(12, Math.min(22, o.rotulo.length + 2)),
    })),
  ];
  estilizarCabecalho(resumo, 1, 44);

  for (const pergunta of PERGUNTAS_PESQUISA) {
    const valores = respostas
      .map((r) => r.respostas?.[pergunta.chave])
      .filter((v): v is number => typeof v === "number");

    const contagens = Object.fromEntries(
      ESCALA_PESQUISA.map((o) => [
        `o${o.valor}`,
        valores.filter((v) => v === o.valor).length,
      ]),
    );
    const media = mediaDaPergunta(valores);
    const concordancia = concordanciaDaPergunta(valores);

    resumo.addRow({
      numero: NUMERO_DA_PERGUNTA.get(pergunta.chave) ?? "",
      secao: SECAO_DA_PERGUNTA.get(pergunta.chave) ?? "",
      pergunta: pergunta.texto,
      total: valores.length,
      media: media ?? "—",
      concordancia: concordancia === null ? "—" : `${concordancia}%`,
      ...contagens,
    });
  }

  resumo.getColumn("pergunta").alignment = { wrapText: true, vertical: "top" };
  resumo.getColumn("secao").alignment = { wrapText: true, vertical: "top" };
  resumo.autoFilter = { from: "A1", to: { row: 1, column: resumo.columnCount } };

  /* ------------------ Aba 2: uma linha por pessoa ------------------ */
  const porPessoa = planilha.addWorksheet("Respostas", {
    views: [{ state: "frozen", xSplit: 1, ySplit: 1 }],
  });

  porPessoa.columns = [
    { header: "Nome", key: "nome", width: 32 },
    { header: "Data", key: "data", width: 12 },
    { header: "Hora", key: "hora", width: 10 },
    ...PERGUNTAS_PESQUISA.map((p) => ({
      // O numero na frente deixa a coluna reconhecivel mesmo quando o
      // cabecalho esta estreito demais para o texto inteiro.
      header: `${NUMERO_DA_PERGUNTA.get(p.chave)}. ${p.texto}`,
      key: p.chave,
      width: 22,
    })),
    ...PERGUNTAS_ABERTAS.map((p) => ({
      header: p.texto,
      key: p.coluna,
      width: 50,
    })),
  ];
  estilizarCabecalho(porPessoa, 1, 96);

  for (const r of respostas) {
    const marcadas = Object.fromEntries(
      PERGUNTAS_PESQUISA.map((p) => {
        const valor = r.respostas?.[p.chave];
        return [p.chave, typeof valor === "number" ? rotuloDaOpcao(valor) : ""];
      }),
    );

    porPessoa.addRow({
      nome: nomePor.get(r.inscricao_id) ?? "(inscrição removida)",
      data: formatarData(r.created_at),
      hora: formatarHora(r.created_at),
      ...marcadas,
      ...Object.fromEntries(
        PERGUNTAS_ABERTAS.map((p) => [p.coluna, r[p.coluna] ?? ""]),
      ),
    });
  }

  for (const p of PERGUNTAS_ABERTAS) {
    porPessoa.getColumn(p.coluna).alignment = { wrapText: true, vertical: "top" };
  }

  if (respostas.length > 0) {
    porPessoa.autoFilter = {
      from: "A1",
      to: { row: 1, column: porPessoa.columnCount },
    };
  } else {
    const vazia = porPessoa.addRow({ nome: "Ninguém respondeu ao questionário ainda." });
    vazia.font = { italic: true, color: { argb: "FF44506B" } };
  }

  /* ------------------ Aba 3: so o que foi escrito ------------------ */
  const comentarios = planilha.addWorksheet("Comentários", {
    views: [{ state: "frozen", ySplit: 1 }],
  });

  comentarios.columns = [
    { header: "Nome", key: "nome", width: 30 },
    { header: "Data", key: "data", width: 12 },
    ...PERGUNTAS_ABERTAS.map((p) => ({
      header: p.texto,
      key: p.coluna,
      width: 52,
    })),
  ];
  estilizarCabecalho(comentarios, 1, 56);

  const comTexto = respostas.filter((r) =>
    PERGUNTAS_ABERTAS.some((p) => (r[p.coluna] ?? "").trim() !== ""),
  );

  for (const r of comTexto) {
    comentarios.addRow({
      nome: nomePor.get(r.inscricao_id) ?? "(inscrição removida)",
      data: formatarData(r.created_at),
      ...Object.fromEntries(
        PERGUNTAS_ABERTAS.map((p) => [p.coluna, r[p.coluna] ?? ""]),
      ),
    });
  }

  for (const p of PERGUNTAS_ABERTAS) {
    comentarios.getColumn(p.coluna).alignment = {
      wrapText: true,
      vertical: "top",
    };
  }
  comentarios.eachRow((linha, numero) => {
    if (numero > 1) linha.alignment = { vertical: "top" };
  });

  if (comTexto.length === 0) {
    const vazia = comentarios.addRow({ nome: "Ninguém escreveu nada ainda." });
    vazia.font = { italic: true, color: { argb: "FF44506B" } };
  }

  console.info("[admin] exportacao do questionario final", {
    administrador: admin.userId,
    respostas: respostas.length,
  });

  const arquivo = await planilha.xlsx.writeBuffer();

  return new NextResponse(arquivo as ArrayBuffer, {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${NOME_ARQUIVO_EXCEL_PESQUISA}"`,
      "Content-Length": String((arquivo as ArrayBuffer).byteLength),
      "Cache-Control": "no-store",
    },
  });
}
