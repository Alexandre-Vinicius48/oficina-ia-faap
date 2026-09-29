import ExcelJS from "exceljs";
import { NextResponse } from "next/server";
import { administradorAtual } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { NOME_ARQUIVO_EXCEL_AVALIACOES, OFICINA } from "@/config/oficina";
import { ROSTOS } from "@/lib/escala";
import { formatarData, formatarHora } from "@/lib/format";
import { dentroDoLimite } from "@/lib/limite-requisicoes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * PLANILHA DAS AVALIACOES DAS AULAS.
 *
 * Duas abas:
 *   Resumo    — uma linha por aula, com total, media e quantas notas de cada
 *   Respostas — uma linha por resposta, com nota, rotulo e comentario
 *
 * A planilha NAO identifica quem respondeu, igual ao painel. O vinculo com a
 * inscricao existe no banco apenas para impedir resposta repetida, e nao e
 * exportado: quem escreveu uma critica nao deve ser identificavel depois.
 */

type Aula = { id: string; numero: number; tema: string; data: string };
type Avaliacao = {
  aula_id: string;
  nota: number;
  comentario: string | null;
  created_at: string;
};

function json(dados: unknown, status: number) {
  return NextResponse.json(dados, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

/** 2026-10-05 -> 05/10/2026, sem passar pelo fuso do servidor. */
function dataDaAula(data: string): string {
  const [ano, mes, dia] = data.split("-");
  return ano && mes && dia ? `${dia}/${mes}/${ano}` : data;
}

function estilizarCabecalho(aba: ExcelJS.Worksheet) {
  const linha = aba.getRow(1);
  linha.font = { bold: true, size: 12, color: { argb: "FFFFFFFF" } };
  linha.alignment = { vertical: "middle", horizontal: "left" };
  linha.height = 26;
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

  const limite = dentroDoLimite(`admin-export-aval:${admin.userId}`, 10, 60 * 1000);
  if (!limite.permitido) {
    return json(
      { erro: "Aguarde um instante antes de baixar a planilha novamente." },
      429,
    );
  }

  const supabase = supabaseAdmin();

  const [resAulas, resAvaliacoes] = await Promise.all([
    supabase.from("aulas").select("id, numero, tema, data").order("numero"),
    supabase
      .from("avaliacoes")
      .select("aula_id, nota, comentario, created_at")
      .order("created_at", { ascending: true }),
  ]);

  if (resAulas.error || resAvaliacoes.error) {
    console.error("[admin] falha ao exportar avaliacoes", {
      codigo: resAulas.error?.code ?? resAvaliacoes.error?.code ?? "desconhecido",
    });
    return json(
      { erro: "Não foi possível gerar a planilha. Tente novamente." },
      500,
    );
  }

  const aulas = (resAulas.data ?? []) as Aula[];
  const avaliacoes = (resAvaliacoes.data ?? []) as Avaliacao[];
  const rotulo = new Map(ROSTOS.map((r) => [r.nota, r.rotulo]));

  const planilha = new ExcelJS.Workbook();
  planilha.creator = `${OFICINA.titulo} - ${OFICINA.subtitulo}`;
  planilha.created = new Date();

  // ---------------------- Aba 1: Resumo ----------------------
  const resumo = planilha.addWorksheet("Resumo", {
    views: [{ state: "frozen", ySplit: 1 }],
  });

  resumo.columns = [
    { header: "Aula", key: "numero", width: 8 },
    { header: "Tema", key: "tema", width: 42 },
    { header: "Data", key: "data", width: 14 },
    { header: "Respostas", key: "total", width: 12 },
    { header: "Média (de " + ROSTOS.length + ")", key: "media", width: 16 },
    ...ROSTOS.map((r) => ({
      header: r.rotulo,
      key: `n${r.nota}`,
      width: Math.max(12, r.rotulo.length + 3),
    })),
  ];
  estilizarCabecalho(resumo);

  for (const aula of aulas) {
    const daAula = avaliacoes.filter((a) => a.aula_id === aula.id);
    const media =
      daAula.length > 0
        ? Number(
            (daAula.reduce((s, a) => s + a.nota, 0) / daAula.length).toFixed(2),
          )
        : null;

    const contagens = Object.fromEntries(
      ROSTOS.map((r) => [`n${r.nota}`, daAula.filter((a) => a.nota === r.nota).length]),
    );

    resumo.addRow({
      numero: aula.numero,
      tema: aula.tema,
      data: dataDaAula(aula.data),
      total: daAula.length,
      media: media ?? "—",
      ...contagens,
    });
  }

  // ---------------------- Aba 2: Respostas ----------------------
  const respostas = planilha.addWorksheet("Respostas", {
    views: [{ state: "frozen", ySplit: 1 }],
  });

  respostas.columns = [
    { header: "Aula", key: "numero", width: 8 },
    { header: "Tema", key: "tema", width: 38 },
    { header: "Nota", key: "nota", width: 8 },
    { header: "Avaliação", key: "rotulo", width: 16 },
    { header: "Comentário", key: "comentario", width: 62 },
    { header: "Data da resposta", key: "data", width: 18 },
    { header: "Hora da resposta", key: "hora", width: 18 },
  ];
  estilizarCabecalho(respostas);

  const porId = new Map(aulas.map((a) => [a.id, a]));

  for (const avaliacao of avaliacoes) {
    const aula = porId.get(avaliacao.aula_id);
    respostas.addRow({
      numero: aula?.numero ?? "",
      tema: aula?.tema ?? "",
      nota: avaliacao.nota,
      rotulo: rotulo.get(avaliacao.nota) ?? "",
      comentario: avaliacao.comentario ?? "",
      data: formatarData(avaliacao.created_at),
      hora: formatarHora(avaliacao.created_at),
    });
  }

  // O comentário é o campo que mais cresce: quebra de linha e topo alinhado.
  respostas.getColumn("comentario").alignment = {
    wrapText: true,
    vertical: "top",
  };
  respostas.eachRow((linha, numero) => {
    if (numero > 1) linha.alignment = { vertical: "top" };
  });

  if (avaliacoes.length > 0) {
    respostas.autoFilter = { from: "A1", to: "G1" };
  }
  if (aulas.length > 0) {
    resumo.autoFilter = {
      from: "A1",
      to: { row: 1, column: resumo.columnCount },
    };
  }

  console.info("[admin] exportacao de avaliacoes", {
    administrador: admin.userId,
    respostas: avaliacoes.length,
  });

  const arquivo = await planilha.xlsx.writeBuffer();

  return new NextResponse(arquivo as ArrayBuffer, {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${NOME_ARQUIVO_EXCEL_AVALIACOES}"`,
      "Content-Length": String((arquivo as ArrayBuffer).byteLength),
      "Cache-Control": "no-store",
    },
  });
}
