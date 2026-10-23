import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// Todo esquema precisa nascer com a configuração de lib/validacao/zod.ts (jitless, sem eval).
const zodSoPeloModulo = {
  name: "zod",
  message: "Use `import * as z from '@/lib/validacao/zod'` (configura o Zod sem eval, por causa da CSP).",
};

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // supabase-js: .or() recebe um filtro em TEXTO que o PostgREST interpreta. Montá-lo com
      // template string (`nome.eq.${busca}`) permite que um valor digitado injete novas
      // condições no filtro. Use filtros encadeados (.eq, .ilike...) ou valide o valor antes.
      "no-restricted-syntax": [
        "error",
        {
          selector: "CallExpression[callee.property.name='or'][arguments.0.type='TemplateLiteral']",
          message: "Proibido .or() com template string (injeção no filtro do PostgREST). Use filtros encadeados.",
        },
      ],
      "no-restricted-imports": ["error", { paths: [zodSoPeloModulo] }],
    },
  },
  {
    // O SDK do Sentry no navegador pesa ~33 KB gzip: só lib/sentry-cliente.ts o carrega, sob demanda.
    files: ["app/**/*.tsx", "componentes/**", "instrumentation-client.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            zodSoPeloModulo,
            {
              name: "@sentry/nextjs",
              message: "No navegador use '@/lib/sentry-cliente' (carrega o SDK só quando precisa). No servidor, lib/logger.ts.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["lib/validacao/zod.ts"],
    rules: { "no-restricted-imports": "off" },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Cópias de trabalho dos agentes (git worktree): cada uma é checada no próprio lugar.
    ".claude/**",
  ]),
]);

export default eslintConfig;
