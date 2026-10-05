import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Cliente com a chave SECRET (role service_role no banco).
// - Só existe no servidor: `server-only` quebra o build se um Client Component importar este arquivo.
// - No banco, service_role NÃO tem acesso a tabelas; só executa as funções de `sistema`
//   (criar_lead, reivindicar_notificacoes...). Se a chave vazar, o estrago fica limitado a isso.
// - Sem sessão: não lê nem grava cookies (é usado por lib/servicos, que não conhece o usuário).

let cliente: SupabaseClient | undefined;

export function clienteSistema(): SupabaseClient {
  if (cliente) return cliente;

  const url = process.env.SUPABASE_URL;
  const chave = process.env.SUPABASE_SECRET_KEY;
  if (!url || !chave) {
    throw new Error("SUPABASE_URL e SUPABASE_SECRET_KEY precisam estar definidos (ver .env.example).");
  }
  if (!chave.startsWith("sb_secret_")) {
    // Barra o uso por engano da chave legada service_role (JWT) ou da publishable.
    throw new Error("SUPABASE_SECRET_KEY deve ser uma chave secret nova (sb_secret_...).");
  }

  cliente = createClient(url, chave, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  return cliente;
}
