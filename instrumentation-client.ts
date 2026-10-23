import { iniciarSentry } from "@/lib/sentry-cliente";

// Sentry no navegador: só com DSN, e baixado depois do load (ver lib/sentry-cliente.ts).
iniciarSentry();

export { onRouterTransitionStart } from "@/lib/sentry-cliente";
