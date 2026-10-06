import * as Sentry from "@sentry/nextjs";
import { opcoesPrivacidade } from "@/lib/sentry-filtro";

// Sentry no runtime edge (usado pelo proxy.ts).
Sentry.init({ ...opcoesPrivacidade });
