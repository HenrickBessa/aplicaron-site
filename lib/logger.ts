import "server-only";
import * as Sentry from "@sentry/nextjs";

// Logger único do servidor. Regra: só campos de uma lista PERMITIDA saem do processo.
// Qualquer outro campo (nome, email, whatsapp, empresa, descrição, IP, tokens...) é
// descartado aqui, mesmo que alguém o passe por engano.
const CAMPOS_PERMITIDOS = ["request_id", "lead_id", "servico", "codigo"] as const;

type Campo = (typeof CAMPOS_PERMITIDOS)[number];
export type DadosLog = Partial<Record<Campo, string | number | null | undefined>>;
type Nivel = "info" | "aviso" | "erro";

function filtrar(dados: Record<string, unknown>): DadosLog {
  const limpo: DadosLog = {};
  for (const campo of CAMPOS_PERMITIDOS) {
    const valor = dados[campo];
    if (typeof valor === "string" || typeof valor === "number") limpo[campo] = valor;
  }
  return limpo;
}

function registrar(nivel: Nivel, evento: string, dados: Record<string, unknown> = {}) {
  const linha = { evento, nivel, ...filtrar(dados) };
  // Uma linha JSON por evento: fácil de filtrar nos logs da Vercel.
  (nivel === "erro" ? console.error : nivel === "aviso" ? console.warn : console.log)(JSON.stringify(linha));
  // Erros também vão ao Sentry, com os mesmos campos já filtrados.
  if (nivel === "erro") Sentry.captureMessage(evento, { level: "error", extra: linha });
}

export const log = {
  info: (evento: string, dados?: Record<string, unknown>) => registrar("info", evento, dados),
  aviso: (evento: string, dados?: Record<string, unknown>) => registrar("aviso", evento, dados),
  erro: (evento: string, dados?: Record<string, unknown>) => registrar("erro", evento, dados),
};
