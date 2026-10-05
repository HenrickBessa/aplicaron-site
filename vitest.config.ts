import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      // Mesmo alias do tsconfig.json.
      "@": fileURLToPath(new URL("./", import.meta.url)),
      // O pacote `server-only` lança erro fora do bundle de servidor do Next.
      // Nos testes rodamos o código de servidor direto no Node, então ele vira um módulo vazio.
      "server-only": fileURLToPath(
        new URL("./testes/stubs/server-only.ts", import.meta.url),
      ),
    },
  },
  test: {
    environment: "node",
    include: ["**/*.test.ts", "**/*.test.tsx"],
    exclude: ["node_modules/**", ".next/**", "e2e/**"],
  },
});
