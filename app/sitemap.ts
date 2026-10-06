import type { MetadataRoute } from "next";
import { clientes } from "@/conteudo/clientes";
import { servicos } from "@/conteudo/servicos";
import { urlAbsoluta } from "@/lib/seo";

// Só páginas indexáveis. Fora: /obrigado (noindex), /admin e /api.
// Sem lastModified/changefrequency/priority: o Google ignora changefreq e priority, e uma
// data de modificação "inventada" (ex.: a data do build) faz ele desconfiar do campo.
export default function sitemap(): MetadataRoute.Sitemap {
  const caminhos = [
    "/",
    "/diagnostico",
    "/sobre",
    "/privacidade",
    "/clientes",
    ...servicos.map((s) => `/servicos/${s.slug}`),
    ...clientes.map((c) => `/clientes/${c.slug}`),
  ];
  return caminhos.map((caminho) => ({ url: urlAbsoluta(caminho) }));
}
