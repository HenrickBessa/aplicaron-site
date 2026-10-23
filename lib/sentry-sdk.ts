// Só as funções do Sentry que o navegador usa. lib/sentry-cliente.ts importa este arquivo sob
// demanda: `import("@sentry/nextjs")` direto levaria o pacote inteiro (~135 KB gzip).
export { captureException, captureRouterTransitionStart, init } from "@sentry/nextjs";
