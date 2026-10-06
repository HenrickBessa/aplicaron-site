import type { Breadcrumb, ErrorEvent } from "@sentry/nextjs";

// Filtro de privacidade aplicado a TODO evento antes de sair para o Sentry
// (navegador, servidor e edge usam a mesma função).

export function filtrarEvento(evento: ErrorEvent): ErrorEvent {
  if (evento.request) {
    // Corpo da requisição (ex.: o formulário de diagnóstico), cookies e cabeçalhos nunca saem.
    delete evento.request.data;
    delete evento.request.cookies;
    delete evento.request.headers;
    // No admin a query string pode carregar filtros com dados de leads (Fase 2).
    if (evento.request.url?.includes("/admin")) {
      delete evento.request.query_string;
      evento.request.url = evento.request.url.split("?")[0];
    }
  }
  // Sem usuário/IP associados ao erro.
  delete evento.user;
  return evento;
}

// Mensagens do console (console.log/error) não viram breadcrumbs: podem conter qualquer coisa.
export function filtrarBreadcrumb(breadcrumb: Breadcrumb): Breadcrumb | null {
  return breadcrumb.category === "console" ? null : breadcrumb;
}

// Opções comuns de privacidade para todas as inicializações do Sentry.
export const opcoesPrivacidade = {
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  // Sem DSN (desenvolvimento, testes) o Sentry fica desligado.
  enabled: Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN) && process.env.NODE_ENV === "production",
  // production / preview (a Vercel expõe NEXT_PUBLIC_VERCEL_ENV também no navegador).
  environment: process.env.NEXT_PUBLIC_VERCEL_ENV ?? process.env.NODE_ENV,
  // Não coleta IP, cookies nem cabeçalhos automaticamente.
  sendDefaultPii: false,
  // Só erros (sem rastreamento de desempenho por enquanto).
  tracesSampleRate: 0,
  beforeSend: filtrarEvento,
  beforeBreadcrumb: filtrarBreadcrumb,
};
