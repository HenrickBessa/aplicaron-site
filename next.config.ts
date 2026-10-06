import createMDX from "@next/mdx";
import { withSentryConfig } from "@sentry/nextjs/config";
import type { NextConfig } from "next";
import { cabecalhosSeguranca } from "./lib/cabecalhos-seguranca";

const nextConfig: NextConfig = {
  // Não anuncia "X-Powered-By: Next.js" (informação gratuita para quem procura falhas).
  poweredByHeader: false,
  // AVIF antes de WebP: imagens ~20–30% menores nos navegadores que suportam.
  images: { formats: ["image/avif", "image/webp"] },
  // "cases" virou "clientes" (06/10/2026). As URLs antigas já foram publicadas e indexadas:
  // o redirecionamento permanente (308, tratado como 301 pelo Google) transfere a relevância.
  // Os cases antigos eram exemplos e não têm equivalente: vão para a lista de clientes.
  async redirects() {
    return [
      // Domínio antigo da Vercel -> domínio da empresa (evita dois sites iguais no Google).
      // Só o endereço exato: os previews (aplicar-on-git-...vercel.app) continuam funcionando.
      // /api/ fica de fora: o cron da Vercel pode chamar a produção pelo endereço .vercel.app.
      {
        source: "/:caminho((?!api/).*)",
        has: [{ type: "host", value: "aplicar-on.vercel.app" }],
        destination: "https://www.aplicaron.com.br/:caminho",
        permanent: true,
      },
      { source: "/cases", destination: "/clientes", permanent: true },
      { source: "/cases/:slug", destination: "/clientes", permanent: true },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: cabecalhosSeguranca({
          producao: process.env.NODE_ENV === "production",
          urlRelatorioCsp: process.env.SENTRY_CSP_REPORT_URI,
        }),
      },
    ];
  },
};

// Permite importar arquivos .mdx de conteudo/ como componentes React.
// Não adicionamos "mdx" em pageExtensions: nenhum MDX vira rota sozinho;
// as páginas em app/ importam o conteúdo explicitamente.
const withMDX = createMDX({});

export default withSentryConfig(withMDX(nextConfig), {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  // Envia os source maps no build (erros legíveis no Sentry) só se o token existir.
  authToken: process.env.SENTRY_AUTH_TOKEN,
  // O navegador manda os erros para /monitoring no nosso domínio, e o servidor repassa ao
  // Sentry. Assim a CSP mantém connect-src 'self' e bloqueadores de anúncio não perdem erros.
  tunnelRoute: "/monitoring",
  widenClientFileUpload: true,
  silent: !process.env.CI,
  // Tira do JavaScript enviado ao navegador o que não usamos: rastreamento de desempenho
  // (tracesSampleRate: 0), Session Replay (desligado por privacidade) e mensagens de depuração.
  // Obs. (06/10/2026): com o Turbopack o ganho não apareceu na medição; vale para builds com webpack.
  bundleSizeOptimizations: {
    excludeDebugStatements: true,
    excludeTracing: true,
    excludeReplayShadowDom: true,
    excludeReplayIframe: true,
    excludeReplayWorker: true,
  },
});
