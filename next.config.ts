import type { NextConfig } from "next";

/**
 * Cabecalhos de seguranca aplicados a todas as rotas.
 *
 * A Content Security Policy NAO fica aqui: ela e montada no middleware
 * (src/middleware.ts), porque precisa de um numero sorteado ("nonce") novo a
 * cada visita para autorizar somente os scripts do proprio Next.js.
 */
const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
        ],
      },
      {
        // Nenhuma pagina ou API administrativa pode ser cacheada.
        source: "/admin/:path*",
        headers: [{ key: "Cache-Control", value: "no-store, max-age=0" }],
      },
      {
        source: "/api/:path*",
        headers: [{ key: "Cache-Control", value: "no-store, max-age=0" }],
      },
    ];
  },
};

export default nextConfig;
