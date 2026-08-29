import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * O middleware roda antes de cada pagina. Ele faz tres coisas:
 *
 *  1. monta a Content Security Policy com um "nonce" novo a cada visita
 *     (numero sorteado que autoriza apenas os scripts do proprio Next.js);
 *  2. renova o cookie de sessao do administrador (senao a sessao cai sozinha);
 *  3. bloqueia /admin/dashboard e /api/admin/* para quem nao esta logado.
 *
 * A conferencia de "e realmente administrador?" NAO acontece aqui, e sim no
 * servidor de cada pagina e de cada rota de API (ver src/lib/auth.ts).
 * O middleware e apenas o primeiro portao.
 *
 * De proposito ele NAO redireciona /admin para o painel quando ha sessao:
 * uma pessoa logada que nao seja administradora ficaria presa em um vaivem
 * entre as duas paginas. Quem decide isso e a propria pagina /admin.
 */

const desenvolvimento = process.env.NODE_ENV !== "production";

function origemSupabase(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) return "";
  try {
    return new URL(url).origin;
  } catch {
    return "";
  }
}

/**
 * Monta a politica de seguranca de conteudo.
 *
 * 'strict-dynamic' + nonce: so roda o script inicial do Next.js (que carrega o
 * nonce sorteado agora) e o que ele proprio carregar. Qualquer script injetado
 * por terceiros - o jeito classico de fazer XSS - e recusado pelo navegador.
 */
function montarCsp(nonce: string): string {
  const scripts = desenvolvimento
    ? `'self' 'unsafe-eval' 'unsafe-inline'`
    : `'nonce-${nonce}' 'strict-dynamic'`;

  return [
    "default-src 'self'",
    `script-src ${scripts}`,
    // O Next.js injeta estilos inline; nao ha como usar nonce neles.
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    `connect-src 'self' ${origemSupabase()}`.trim(),
    "frame-ancestors 'none'",
    "frame-src 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "upgrade-insecure-requests",
  ].join("; ");
}

export async function middleware(request: NextRequest) {
  const nonce = crypto.randomUUID().replace(/-/g, "");
  const csp = montarCsp(nonce);

  // O Next.js le o cabecalho da REQUISICAO para carimbar o nonce nos scripts
  // que ele mesmo gera.
  const cabecalhosDaRequisicao = new Headers(request.headers);
  cabecalhosDaRequisicao.set("x-nonce", nonce);
  cabecalhosDaRequisicao.set("content-security-policy", csp);

  const opcoes = { request: { headers: cabecalhosDaRequisicao } };
  let resposta = NextResponse.next(opcoes);
  resposta.headers.set("content-security-policy", csp);

  const caminho = request.nextUrl.pathname;
  const areaAdministrativa =
    caminho.startsWith("/admin") || caminho.startsWith("/api/admin");

  // Fora da area administrativa nao ha sessao para renovar: seguimos direto.
  if (!areaAdministrativa) return resposta;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const chave = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !chave) return resposta;

  const supabase = createServerClient(url, chave, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(lista) {
        for (const { name, value } of lista) {
          request.cookies.set(name, value);
        }
        resposta = NextResponse.next(opcoes);
        resposta.headers.set("content-security-policy", csp);
        for (const { name, value, options } of lista) {
          resposta.cookies.set(name, value, options);
        }
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const areaProtegida =
    caminho.startsWith("/admin/dashboard") || caminho.startsWith("/api/admin");

  if (areaProtegida && !user) {
    if (caminho.startsWith("/api/")) {
      return NextResponse.json(
        { erro: "Acesso restrito. Faça login novamente." },
        {
          status: 401,
          headers: { "Cache-Control": "no-store", "Content-Security-Policy": csp },
        },
      );
    }
    const destino = request.nextUrl.clone();
    destino.pathname = "/admin";
    destino.search = "";
    const redirecionamento = NextResponse.redirect(destino);
    redirecionamento.headers.set("content-security-policy", csp);
    return redirecionamento;
  }

  return resposta;
}

export const config = {
  matcher: [
    /**
     * Roda em todas as paginas, menos nos arquivos estaticos (imagens, fontes
     * e o codigo ja empacotado), que nao precisam de nonce nem de sessao.
     */
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?)$).*)",
  ],
};
