import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

// Cria um admin de teste no Supabase LOCAL: usuário no Auth (API admin, chave secret) +
// linha em public.admins. A tabela `admins` não tem grant para ninguém (inserção só manual,
// como em produção), então a linha entra pelo psql do container do banco local.
export async function criarAdminTeste() {
  const url = process.env.SUPABASE_URL!;
  if (!url.startsWith("http://127.0.0.1")) throw new Error("Só no Supabase local.");

  const email = `admin-${randomUUID()}@teste.local`;
  const senha = `Senha-${randomUUID()}`;
  const auth = createClient(url, process.env.SUPABASE_SECRET_KEY!, { auth: { persistSession: false } }).auth;
  const { data, error } = await auth.admin.createUser({ email, password: senha, email_confirm: true });
  if (error) throw error;

  execFileSync("docker", [
    "exec",
    "supabase_db_aplicaron",
    "psql",
    "-U",
    "postgres",
    "-c",
    `insert into public.admins (user_id) values ('${data.user.id}')`,
  ]);
  return { email, senha, userId: data.user.id };
}
