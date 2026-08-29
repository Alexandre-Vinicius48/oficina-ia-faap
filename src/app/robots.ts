import type { MetadataRoute } from "next";

/** Impede que buscadores indexem a area administrativa e as rotas de API. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/api/"] }],
  };
}
