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
 * Sem filtro, traz tudo, separado por dia:
 *   Resumo   — uma linha por aula, com total, media e quantas notas de cada
 *   Aula 1   — as respostas daquele encontro, com os comentarios
 *   Aula 2   — e assim por diante, uma aba por aula
 *
 * Com ?aula=<id>, traz so aquele encontro, em um arquivo com o numero e a
 * data no nome.
 *
 * O identificador da aula viaja na URL sem problema: e um codigo interno do
 * sistema, nao um dado de ninguem. A regra de nunca por dado pessoal em
 * endereco continua valendo para CPF e celular, que seguem em POST.
 *
 * A planilha TRAZ o nome de quem respondeu, a pedido da organizacao. A tela
 * de avaliacao avisa isso ao participante antes de ele enviar — a promessa
 * na tela e a planilha precisam dizer a mesma coisa.
 */

type Aula = { id: string; numero: number; tema: string; data: string };
type Avaliacao = {
  aula_id: string;
  inscricao_id: string;
  nota: number;
  comentario: string | null;
  created_at: string;
};

type Inscrito = { id: string; nome_completo: string };

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

function estilizarCabecalho(aba: ExcelJS.Worksheet, numeroDaLinha = 1) {
  const linha = aba.getRow(numeroDaLinha);
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

export async function GET(request: Request) {
  const admin = await administradorAtual();
  if (!admin) return json({ erro: "Acesso restrito." }, 403);

  const limite = dentroDoLimite(`admin-export-aval:${admin.userId}`, 10, 60 * 1000);
  if (!limite.permitido) {
    return json(
      { erro: "Aguarde um instante antes de baixar a planilha novamente." },
      429,
    );
  }

  // Filtro opcional: uma aula so.
  const pedida = new URL(request.url).searchParams.get("aula");
  const filtroValido =
    pedida && /^[0-9a-f-]{36}$/i.test(pedida) ? pedida : null;
  if (pedida && !filtroValido) {
    return json({ erro: "Aula inválida." }, 400);
  }

  const supabase = supabaseAdmin();

  const [resAulas, resAvaliacoes] = await Promise.all([
    supabase.from("aulas").select("id, numero, tema, data").order("numero"),
    supabase
      .from("avaliacoes")
      .select("aula_id, inscricao_id, nota, comentario, created_at")
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

  // Nomes de quem respondeu. Buscamos SO o nome: nem CPF, nem celular, nem
  // e-mail entram na planilha de avaliacoes — a organizacao pediu para saber
  // quem escreveu, nao para ter uma segunda copia do cadastro.
  const resInscritos = await supabase
    .from("inscricoes")
    .select("id, nome_completo");

  if (resInscritos.error) {
    console.error("[admin] falha ao buscar nomes para a exportacao", {
      codigo: resInscritos.error.code ?? "desconhecido",
    });
    return json(
      { erro: "Não foi possível gerar a planilha. Tente novamente." },
      500,
    );
  }

  const nomePorInscricao = new Map(
    ((resInscritos.data ?? []) as Inscrito[]).map((i) => [i.id, i.nome_completo]),
  );

  let aulas = (resAulas.data ?? []) as Aula[];
  let avaliacoes = (resAvaliacoes.data ?? []) as Avaliacao[];

  if (filtroValido) {
    aulas = aulas.filter((a) => a.id === filtroValido);
    if (aulas.length === 0) return json({ erro: "Aula não encontrada." }, 404);
    avaliacoes = avaliacoes.filter((a) => a.aula_id === filtroValido);
  }
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

  if (aulas.length > 0) {
    resumo.autoFilter = { from: "A1", to: { row: 1, column: resumo.columnCount } };
  }

  // ---------------- Uma aba por aula, com as respostas ----------------
  // Separado por dia de proposito: juntar tudo numa aba so obriga a filtrar
  // a planilha para olhar um encontro. Com uma aba por aula, cada dia abre
  // pronto, e as abas ficam na ordem do cronograma.
  for (const aula of aulas) {
    const daAula = avaliacoes.filter((a) => a.aula_id === aula.id);

    // O Excel limita o nome da aba a 31 caracteres e proibe : \\ / ? * [ ]
    const nomeDaAba = `Aula ${aula.numero}`;
    const aba = planilha.addWorksheet(nomeDaAba, {
      views: [{ state: "frozen", ySplit: 2 }],
    });

    aba.columns = [
      { header: "Nome", key: "nome", width: 34 },
      { header: "Nota", key: "nota", width: 8 },
      { header: "Avaliação", key: "rotulo", width: 16 },
      { header: "Comentário", key: "comentario", width: 62 },
      { header: "Data da resposta", key: "data", width: 18 },
      { header: "Hora da resposta", key: "hora", width: 18 },
    ];

    // Linha 1: o tema e a data do encontro, para quem abrir a aba saber de
    // qual aula se trata sem voltar ao resumo.
    aba.spliceRows(1, 0, [`Aula ${aula.numero} — ${aula.tema} — ${dataDaAula(aula.data)}`]);
    aba.mergeCells("A1:F1");
    const titulo = aba.getRow(1);
    titulo.height = 28;
    titulo.font = { bold: true, size: 13, color: { argb: "FF0D2350" } };
    titulo.alignment = { vertical: "middle" };
    titulo.getCell(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFDDE7FB" },
    };

    estilizarCabecalho(aba, 2);

    for (const avaliacao of daAula) {
      aba.addRow({
        nome: nomePorInscricao.get(avaliacao.inscricao_id) ?? "(inscrição removida)",
        nota: avaliacao.nota,
        rotulo: rotulo.get(avaliacao.nota) ?? "",
        comentario: avaliacao.comentario ?? "",
        data: formatarData(avaliacao.created_at),
        hora: formatarHora(avaliacao.created_at),
      });
    }

    // O comentário é a única coluna que cresce de verdade.
    aba.getColumn("comentario").alignment = { wrapText: true, vertical: "top" };
    aba.eachRow((linha, numero) => {
      if (numero > 2) linha.alignment = { vertical: "top" };
    });

    if (daAula.length > 0) {
      aba.autoFilter = { from: "A2", to: "F2" };
    } else {
      const vazia = aba.addRow({ comentario: "Nenhuma resposta nesta aula." });
      vazia.font = { italic: true, color: { argb: "FF44506B" } };
    }
  }

  console.info("[admin] exportacao de avaliacoes", {
    administrador: admin.userId,
    respostas: avaliacoes.length,
  });

  const arquivo = await planilha.xlsx.writeBuffer();

  // Uma aula so ganha nome proprio, para nao sobrescrever o arquivo geral
  // na pasta de downloads.
  const soUmaAula = filtroValido ? aulas[0] : null;
  const nomeDoArquivo = soUmaAula
    ? `avaliacoes_aula${soUmaAula.numero}_${soUmaAula.data}.xlsx`
    : NOME_ARQUIVO_EXCEL_AVALIACOES;

  return new NextResponse(arquivo as ArrayBuffer, {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${nomeDoArquivo}"`,
      "Content-Length": String((arquivo as ArrayBuffer).byteLength),
      "Cache-Control": "no-store",
    },
  });
}
