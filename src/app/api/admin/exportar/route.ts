import ExcelJS from "exceljs";
import { NextResponse } from "next/server";
import { administradorAtual } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { NOME_ARQUIVO_EXCEL, OFICINA } from "@/config/oficina";
import {
  formatarData,
  formatarHora,
  mascararCelular,
  mascararCpf,
} from "@/lib/format";
import { dentroDoLimite } from "@/lib/limite-requisicoes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Gera o arquivo Excel com a lista de inscritos.
 *
 * O arquivo so e montado DEPOIS que o servidor confirma que quem pediu e
 * administrador. Nao existe nenhuma outra rota capaz de devolver a base
 * inteira, e esta aqui nao aceita nenhum parametro pela URL.
 */

const LOTE = 1000;

type Linha = {
  nome_completo: string;
  cpf: string;
  rg: string;
  celular: string;
  email: string;
  data_inscricao: string;
};

async function buscarTodos(): Promise<Linha[]> {
  const supabase = supabaseAdmin();
  const todos: Linha[] = [];

  // Busca em lotes para nao estourar o limite de linhas por requisicao.
  for (let inicio = 0; ; inicio += LOTE) {
    const { data, error } = await supabase
      .from("inscricoes")
      .select("nome_completo, cpf, rg, celular, email, data_inscricao")
      .order("data_inscricao", { ascending: false })
      .range(inicio, inicio + LOTE - 1);

    if (error) {
      console.error("[admin] falha ao exportar", {
        codigo: error.code ?? "desconhecido",
      });
      throw new Error("falha_exportacao");
    }

    todos.push(...((data ?? []) as Linha[]));
    if (!data || data.length < LOTE) break;
  }

  return todos;
}

export async function GET() {
  const admin = await administradorAtual();

  if (!admin) {
    return NextResponse.json(
      { erro: "Acesso restrito." },
      { status: 403, headers: { "Cache-Control": "no-store" } },
    );
  }

  const limite = dentroDoLimite(`admin-export:${admin.userId}`, 10, 60 * 1000);
  if (!limite.permitido) {
    return NextResponse.json(
      { erro: "Aguarde um instante antes de baixar a lista novamente." },
      { status: 429, headers: { "Cache-Control": "no-store" } },
    );
  }

  let linhas: Linha[];
  try {
    linhas = await buscarTodos();
  } catch {
    return NextResponse.json(
      { erro: "Não foi possível gerar a planilha. Tente novamente." },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }

  // Registro de auditoria: quem exportou e quantas linhas. Sem dados pessoais.
  console.info("[admin] exportacao gerada", {
    administrador: admin.userId,
    linhas: linhas.length,
  });

  const planilha = new ExcelJS.Workbook();
  planilha.creator = `${OFICINA.titulo} - ${OFICINA.subtitulo}`;
  planilha.created = new Date();

  const aba = planilha.addWorksheet("Inscritos", {
    views: [{ state: "frozen", ySplit: 1 }],
  });

  aba.columns = [
    { header: "Nome completo", key: "nome", width: 38 },
    { header: "CPF", key: "cpf", width: 18 },
    { header: "RG", key: "rg", width: 16 },
    { header: "Celular", key: "celular", width: 20 },
    { header: "E-mail", key: "email", width: 34 },
    { header: "Data da inscrição", key: "data", width: 18 },
    { header: "Hora da inscrição", key: "hora", width: 18 },
  ];

  const cabecalho = aba.getRow(1);
  cabecalho.font = { bold: true, size: 12, color: { argb: "FFFFFFFF" } };
  cabecalho.alignment = { vertical: "middle", horizontal: "left" };
  cabecalho.height = 26;
  cabecalho.eachCell((celula) => {
    celula.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF113A6B" },
    };
    celula.border = { bottom: { style: "thin", color: { argb: "FF0B2747" } } };
  });

  for (const linha of linhas) {
    aba.addRow({
      nome: linha.nome_completo,
      // Texto, para o Excel nao comer o zero da frente nem virar numero.
      cpf: mascararCpf(linha.cpf),
      rg: linha.rg,
      celular: mascararCelular(linha.celular),
      email: linha.email,
      data: formatarData(linha.data_inscricao),
      hora: formatarHora(linha.data_inscricao),
    });
  }

  aba.eachRow((linha, numero) => {
    if (numero === 1) return;
    linha.alignment = { vertical: "middle" };
    linha.getCell("cpf").numFmt = "@";
    linha.getCell("rg").numFmt = "@";
    linha.getCell("celular").numFmt = "@";
  });

  aba.autoFilter = { from: "A1", to: "G1" };

  const arquivo = await planilha.xlsx.writeBuffer();

  return new NextResponse(arquivo as ArrayBuffer, {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${NOME_ARQUIVO_EXCEL}"`,
      "Content-Length": String((arquivo as ArrayBuffer).byteLength),
      "Cache-Control": "no-store",
    },
  });
}
