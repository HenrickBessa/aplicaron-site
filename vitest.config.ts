import { fileURLToPath } from "node:url";
import mdx from "@mdx-js/rollup";
import { defineConfig } from "vitest/config";

export default defineConfig({
  // No app quem compila .mdx é o Next (@next/mdx); nos testes, o plugin oficial do MDX.
  plugins: [mdx()],
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
