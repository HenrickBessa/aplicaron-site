// Configuração da sessão do admin, usada pelo proxy.ts e por lib/supabase/servidor.ts.
// Fica fora de lib/supabase porque o proxy não pode importar `server-only`.

// httpOnly: o JavaScript da página nunca lê o token (um XSS não rouba a sessão).
// path /admin: o navegador só manda os cookies para o admin, nunca para o site público.
export const OPCOES_COOKIE_SESSAO = {
  httpOnly: true,
  secure: true,
  sameSite: "lax",
  path: "/admin",
} as const;

export function ambienteSupabasePublico() {
  const url = process.env.SUPABASE_URL;
  const chave = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !chave) {
    throw new Error("SUPABASE_URL e SUPABASE_PUBLISHABLE_KEY precisam estar definidos (ver .env.example).");
  }
  if (!chave.startsWith("sb_publishable_")) {
    // Barra o uso por engano da chave legada anon (JWT) ou da secret.
    throw new Error("SUPABASE_PUBLISHABLE_KEY deve ser uma chave publishable nova (sb_publishable_...).");
  }
  return { url, chave };
}
