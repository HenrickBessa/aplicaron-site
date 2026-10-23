import { opcoesPrivacidade } from "@/lib/sentry-filtro";

// Sentry no navegador, baixado só quando há DSN (opcoesPrivacidade.enabled) e só depois de a
// página carregar: o SDK pesa ~33 KB gzip e atrasava todas as páginas, até sem DSN.
// Nenhum arquivo do navegador importa "@sentry/nextjs" direto; tudo passa por aqui.
// Sem Session Replay: nada da tela ou do que o visitante digita é gravado.
// Envio pelo túnel /monitoring (ver next.config.ts).

type Sdk = typeof import("@/lib/sentry-sdk");

let carregando: Promise<Sdk | undefined> | undefined;
let sdk: Sdk | undefined;

// Erros globais antes de o SDK chegar: disparam o carregamento e são enviados quando ele termina.
function erroAntes(e: ErrorEvent | PromiseRejectionEvent) {
  if ("reason" in e) capturarErro(e.reason);
  else if (e.error) capturarErro(e.error);
}

function carregarSentry() {
  if (!opcoesPrivacidade.enabled) return undefined;
  carregando ??= import("@/lib/sentry-sdk")
    .then((Sentry) => {
      Sentry.init({ ...opcoesPrivacidade });
      // Daqui em diante o próprio SDK captura os erros globais (sem isto, iriam duplicados).
      removeEventListener("error", erroAntes);
      removeEventListener("unhandledrejection", erroAntes);
      sdk = Sentry;
      return Sentry;
    })
    // Falha ao baixar (rede, bloqueador): segue sem Sentry. Sem o catch, a rejeição viraria
    // um "unhandledrejection" que chamaria erroAntes de novo, sem fim.
    .catch(() => undefined);
  return carregando;
}

// Para as error boundaries (error.tsx), que "engolem" o erro.
export function capturarErro(erro: unknown) {
  void carregarSentry()?.then((Sentry) => Sentry?.captureException(erro));
}

// Chamado pelo instrumentation-client.ts, antes da hidratação.
export function iniciarSentry() {
  if (!opcoesPrivacidade.enabled) return;
  addEventListener("error", erroAntes);
  addEventListener("unhandledrejection", erroAntes);
  // Depois do load, quando o navegador estiver ocioso (Safari não tem requestIdleCallback).
  const quandoOcioso = () =>
    "requestIdleCallback" in window ? requestIdleCallback(carregarSentry, { timeout: 5000 }) : setTimeout(carregarSentry, 1000);
  if (document.readyState === "complete") quandoOcioso();
  else addEventListener("load", quandoOcioso, { once: true });
}

// Navegações antes de o SDK carregar não são registradas (só servem ao rastreamento, que está desligado).
export function onRouterTransitionStart(...args: Parameters<Sdk["captureRouterTransitionStart"]>) {
  sdk?.captureRouterTransitionStart(...args);
}
