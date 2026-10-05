import { execSync } from "node:child_process";

// Roda antes dos testes de integração (setupFiles): pega URL e chaves do Supabase LOCAL
// via `supabase status`. Só aceita 127.0.0.1; nunca aponta para o banco de produção.
const status = JSON.parse(execSync("npx supabase status -o json", { encoding: "utf8" })) as Record<string, string>;
if (!status.API_URL?.startsWith("http://127.0.0.1")) {
  throw new Error("Testes de integração só rodam contra o Supabase local. Rode `npm run db:start`.");
}
process.env.SUPABASE_URL = status.API_URL;
process.env.SUPABASE_SECRET_KEY = status.SECRET_KEY;
process.env.SUPABASE_PUBLISHABLE_KEY = status.PUBLISHABLE_KEY;
