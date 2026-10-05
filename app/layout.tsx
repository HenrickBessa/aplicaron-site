import type { Metadata } from "next";
import { Inter, Sora } from "next/font/google";
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

// Metadados completos (title.template, canonical, Open Graph) entram na fatia 6.
export const metadata: Metadata = {
  title: "AplicarOn",
  description: "Sites, sistemas, aplicativos e automação com IA.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${sora.variable}`}>
      <body className="flex min-h-dvh flex-col">{children}</body>
    </html>
  );
}
