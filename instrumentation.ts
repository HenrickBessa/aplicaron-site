import * as Sentry from "@sentry/nextjs";

// Carrega a configuração do Sentry certa para o runtime em que o código está rodando.
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") await import("./sentry.server.config");
  if (process.env.NEXT_RUNTIME === "edge") await import("./sentry.edge.config");
}

// Erros não tratados no servidor (páginas, Server Actions, rotas) vão para o Sentry.
export const onRequestError = Sentry.captureRequestError;
