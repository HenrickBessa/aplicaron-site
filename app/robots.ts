import type { MetadataRoute } from "next";
import { urlAbsoluta } from "@/lib/seo";

// /obrigado NÃO é bloqueada aqui de propósito: ela tem noindex, e o Google só lê o noindex
// se puder acessar a página. Bloquear no robots poderia fazê-la aparecer indexada sem conteúdo.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/api/", "/monitoring"] },
    sitemap: urlAbsoluta("/sitemap.xml"),
  };
}
