import { execSync } from "node:child_process";
import { defineConfig, devices } from "@playwright/test";

const PORTA = 3100;

// O app dos testes fala com o Supabase LOCAL. As chaves vêm de `supabase status`
// (são as chaves padrão do ambiente local, iguais em qualquer máquina).
function ambienteSupabaseLocal(): Record<string, string> {
  const status = JSON.parse(execSync("npx supabase status -o json", { encoding: "utf8" })) as Record<string, string>;
  return {
    SUPABASE_URL: status.API_URL,
    SUPABASE_PUBLISHABLE_KEY: status.PUBLISHABLE_KEY,
    SUPABASE_SECRET_KEY: status.SECRET_KEY,
  };
}

const supabase = ambienteSupabaseLocal();
// Os testes E2E também usam as chaves (para conferir o que foi gravado).
Object.assign(process.env, supabase);

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: `http://localhost:${PORTA}`,
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  // Testa o build de produção, não o dev server: é o que vai para a Vercel.
  webServer: {
    command: `npm run build && npm run start -- -p ${PORTA}`,
    url: `http://localhost:${PORTA}`,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    // URL canônica fixa nos testes (independe do .env.local de cada máquina).
    env: { ...supabase, NEXT_PUBLIC_SITE_URL: "https://www.aplicaron.com.br" },
  },
});
