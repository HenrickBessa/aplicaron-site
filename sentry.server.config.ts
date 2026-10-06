import * as Sentry from "@sentry/nextjs";
import { opcoesPrivacidade } from "@/lib/sentry-filtro";

// Sentry no servidor Node (Server Components, Server Actions, rotas de API).
Sentry.init({ ...opcoesPrivacidade });
