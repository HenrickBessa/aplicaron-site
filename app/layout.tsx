import type { Metadata, Viewport } from "next";
import { Inter, Sora } from "next/font/google";
import { site, URL_SITE } from "@/conteudo/site";
import { IMAGEM_SOCIAL } from "@/lib/seo";
import "./globals.css";

// next/font baixa as fontes no build e serve do nosso domínio: o navegador nunca fala com o Google.
// São fontes variáveis, então um arquivo cobre todos os pesos.
const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

const sora = Sora({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sora",
});

// Metadados globais. Cada página define título, descrição e canonical com lib/seo.ts.
// Não há canonical aqui de propósito (ver comentário em lib/seo.ts).
export const metadata: Metadata = {
  // Base para transformar caminhos relativos (canonical, og:url, og:image) em URLs absolutas.
  metadataBase: new URL(URL_SITE),
  title: { default: `${site.nome} · Sites, sistemas, apps e automação com IA`, template: `%s · ${site.nome}` },
  description:
    "A AplicarOn desenvolve sites, sistemas, aplicativos e automações com IA sob medida. Peça um diagnóstico gratuito.",
  applicationName: site.nome,
  // Indexável por padrão; páginas como /obrigado sobrescrevem com noindex.
  // max-image-preview:large permite miniaturas grandes nos resultados do Google.
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 },
  },
  openGraph: { type: "website", locale: "pt_BR", siteName: site.nome, images: [IMAGEM_SOCIAL] },
  twitter: { card: "summary_large_image", images: [IMAGEM_SOCIAL] },
  // Verificação do Google Search Console (meta tag). Só aparece se a variável existir.
  verification: process.env.GOOGLE_SITE_VERIFICATION ? { google: process.env.GOOGLE_SITE_VERIFICATION } : undefined,
  formatDetection: { telephone: false, email: false, address: false },
};

export const viewport: Viewport = {
  themeColor: "#0b1a2e",
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${sora.variable}`}>
      <body className="isolate flex min-h-dvh flex-col">{children}</body>
    </html>
  );
}
