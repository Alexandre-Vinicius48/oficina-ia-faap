import type { Metadata, Viewport } from "next";
import { OFICINA } from "@/config/oficina";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: `${OFICINA.titulo} — ${OFICINA.subtitulo}`,
    template: `%s — ${OFICINA.titulo}`,
  },
  description: OFICINA.chamada,
  robots: {
    // A area administrativa nunca deve aparecer em buscadores.
    index: true,
    follow: true,
    nocache: true,
  },
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
  themeColor: "#113a6b",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body className="flex min-h-dvh flex-col antialiased">
        <a href="#conteudo" className="pular-link">
          Pular para o conteúdo
        </a>
        {children}
      </body>
    </html>
  );
}
