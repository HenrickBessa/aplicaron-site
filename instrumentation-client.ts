import * as Sentry from "@sentry/nextjs";
import { opcoesPrivacidade } from "@/lib/sentry-filtro";

// Sentry no navegador. Sem Session Replay (não adicionamos replayIntegration): nada da tela
// ou do que o visitante digita é gravado. Envio pelo túnel /monitoring (ver next.config.ts).
Sentry.init({ ...opcoesPrivacidade });

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
