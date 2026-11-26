# AplicarOn: site e captação de leads

Código do site [www.aplicaron.com.br](https://www.aplicaron.com.br): páginas públicas estáticas em MDX, diagnóstico com captação de leads, planos e o painel `/admin` com login e MFA.

Desenvolvido por Henrick Bessa ([perfil](https://www.aplicaron.com.br/henrick)).

> Espelho público do repositório privado da AplicarOn. O registro interno de decisões (`docs/`) não faz parte deste espelho e foi retirado do histórico.

## Stack

Next.js 16 (App Router) · TypeScript estrito · Tailwind v4 · Supabase (Postgres + Auth) · Zod · Vitest · pgTAP · Playwright + axe · Resend · Sentry · Vercel.

## Segurança

- O navegador nunca fala com o Supabase: toda leitura e escrita passa pelo servidor, e cada Server Action valida a entrada com Zod.
- RLS em todas as tabelas, `anon` sem acesso e nenhum DELETE. As políticas do admin exigem MFA (`aal2`). Testes pgTAP em `supabase/tests/`.
- CSP e cabeçalhos de segurança em `lib/cabecalhos-seguranca.ts`, com um teste E2E que confere zero violações nas páginas principais.
- Logs sem dados pessoais: `lib/logger.ts` descarta qualquer campo fora da lista permitida.
- CI (`.github/workflows/ci.yml`): scan de segredos, typecheck, lint, testes unitários, integração, pgTAP e E2E com axe.

## Como rodar

Precisa de Node 22 (via nvm, `.nvmrc`) e Docker para o Supabase local.

```bash
nvm use
npm ci
npm run db:start             # Supabase local; mostra a URL e as chaves locais
cp .env.example .env.local   # preencha com os valores do db:start
npm run dev                  # http://localhost:3000
```

Testes:

```bash
npm test                # unitários (Vitest)
npm run test:integracao # integração com o Supabase local
npm run db:test         # pgTAP
npm run test:e2e        # Playwright + axe no build de produção
```

## Como o projeto é feito

Em fatias pequenas, com agentes de IA (Claude Code) e revisão humana em cada mudança. `CLAUDE.md` e `AGENTS.md` são as instruções do projeto para os agentes.
