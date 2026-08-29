import type { Metadata, Viewport } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import { OFICINA } from "@/config/oficina";
import "./globals.css";

/**
 * Fontes do Google baixadas na hora de montar o projeto e servidas pelo
 * proprio site. Nenhuma requisicao sai para fora quando alguem visita a
 * pagina — bom para privacidade, para velocidade e para a politica de
 * seguranca (CSP).
 */
const fonteTitulo = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--fonte-titulo",
  display: "swap",
});

const fonteTexto = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--fonte-texto",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: `${OFICINA.titulo} — ${OFICINA.subtitulo}`,
    template: `%s — ${OFICINA.titulo}`,
  },
  description: OFICINA.chamada,
  robots: { index: true, follow: true, nocache: true },
};

/**
 * Todas as paginas sao geradas a cada visita.
 *
 * Motivo: a Content Security Policy usa um "nonce" sorteado por visita
 * (ver src/middleware.ts). Uma pagina gerada uma unica vez, na hora do build,
 * carregaria um nonce velho e o navegador recusaria os scripts do site.
 * Como o site e pequeno, gerar a pagina a cada visita nao pesa.
 */
export const dynamic = "force-dynamic";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Nao travamos o zoom: a pessoa precisa poder aumentar a letra.
  maximumScale: 5,
  themeColor: "#16398a",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className={`${fonteTitulo.variable} ${fonteTexto.variable}`}>
      <body className="flex min-h-dvh flex-col antialiased">
        <a href="#conteudo" className="pular-link">
          Pular para o conteúdo
        </a>
        {children}
      </body>
    </html>
  );
}
