import type { MetadataRoute } from "next";
import { site } from "@/conteudo/site";

// Web App Manifest: nome e cores quando o site é adicionado à tela de início do celular.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: site.nome,
    short_name: site.nome,
    description: site.slogan,
    start_url: "/",
    display: "standalone",
    background_color: "#0b1a2e",
    theme_color: "#0b1a2e",
    lang: "pt-BR",
    icons: [
      { src: "/icon.png", sizes: "192x192", type: "image/png" },
      { src: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  };
}
