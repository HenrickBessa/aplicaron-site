@AGENTS.md

# AplicarOn — site + captação de leads (Fase 1 / MVP)

Decisões completas e justificativas: `docs/decisoes.md` (fonte de verdade). Leia antes de mudar arquitetura, banco ou segurança.

## Como trabalhar neste projeto

- O desenvolvedor é o Henrick. Explique o que cada parte faz e por quê; ele quer entender, não só copiar.
- Ambiente: Windows + WSL (Ubuntu), zsh. Sempre diga em qual ambiente cada comando roda.
- Avise **antes** de qualquer comando destrutivo ou que possa perder alterações locais.
- Trabalhe em fatias (lista em `docs/decisoes.md`). Ao fim de cada fatia: pare, resuma, diga como verificar e sugira o commit. Só avance com aprovação.
- Commits pequenos, em português, formato `tipo: descrição` (feat, fix, chore, test, docs).
- Não troque tecnologia nem afrouxe segurança por conta própria; discorde antes, explicando.
- Solução simples primeiro; abstração só com motivo real.

## Stack

Next.js 16.4.2 (App Router, versão fixa) · TypeScript estrito · Tailwind v4 · Supabase (Postgres + Auth) · Supabase CLI 2.121.0 (devDependency) · Zod · Vitest · pgTAP · Playwright + axe · Resend · Sentry · Vercel (`gru1`) · Node 22 via nvm (`.nvmrc`).

Chaves Supabase: só **publishable** e **secret**. Nunca anon/service_role legadas.

## Comandos (WSL, na raiz do projeto)

```bash
nvm use                 # ativa o Node do .nvmrc
npm ci                  # instala exatamente o lockfile
npm run dev             # servidor de desenvolvimento (localhost:3000)
npm run build           # build de produção
npm run typecheck       # tsc --noEmit
npm run lint            # ESLint
npm test                # Vitest: testes unitários (não precisa de banco)
npm run test:integracao # Vitest contra o Supabase local (precisa de db:start)
npm run test:e2e        # Playwright no build de produção, com Supabase local (precisa de db:start)
npm run imagens         # regenera logos, favicon e imagens a partir de assets/ (sharp)
npm run db:start        # Supabase local (Docker)
npm run db:stop         # para o Supabase local
npm run db:reset        # recria o banco local aplicando as migrações  ⚠ apaga dados locais
npm run db:test         # testes pgTAP (supabase test db)
```

## Regras de arquitetura

- O navegador **nunca** fala com o Supabase. Toda leitura/escrita passa pelo servidor.
- `proxy.ts` (Next 16, substitui `middleware.ts`): matcher só `/admin/:path*`. Só renova sessão e faz redirect otimista. Nunca lê tabela nem decide acesso a dado.
- Server Actions validam com Zod e delegam. Trate toda Action como endpoint público.
- `lib/dal/*`: autorização + dados do admin; toda função começa com `exigirAdmin()`.
- `lib/servicos/*`: orquestração sem sessão (sem cookies, sem request).
- `lib/supabase/servidor.ts` (publishable + cookies) · `lib/supabase/sistema.ts` (secret).
- Todo arquivo em `lib/dal`, `lib/servicos`, `lib/supabase` começa com `import 'server-only'`. Client Components nunca importam desses módulos.
- Páginas públicas estáticas (`generateStaticParams` em serviços/cases). Dados de lead nunca em cache compartilhado.
- Conteúdo em MDX em `conteudo/` (serviços, clientes, sobre, política), não no banco. Lista de tecnologias em `conteudo/tecnologias.ts`.
- Imagens: originais em `assets/`, versões servidas geradas por `npm run imagens`; no código, sempre `next/image` com import estático.
- Animações: só CSS, sempre dentro de `prefers-reduced-motion: no-preference` e pausáveis pelo botão do rodapé (`html[data-animacoes="pausadas"]`).
- Cada segmento com `loading.tsx`, `error.tsx`, `not-found.tsx`.
- `app/admin/` é Fase 2: não criar agora.
- Next 16 tem mudanças incompatíveis: consulte `node_modules/next/dist/docs/` antes de usar uma API.

## Regras de segurança

- Banco: RLS em todas as tabelas; `anon` sem nada; `service_role` sem grant em tabela (só EXECUTE em `sistema.*`); nenhum DELETE para ninguém; políticas com `(select privado.admin_mfa())`; `SECURITY DEFINER` sempre com `SET search_path = ''` e nomes qualificados; default privileges revogados.
- Toda migração vem com testes pgTAP em `supabase/tests/`.
- Nunca commitar segredos. O CI falha se encontrar `sb_secret_` (Supabase) ou chave de API do Asaas (`$aact_…`) no repositório. Valores reais só em `.env.local` (ignorado) e no painel da Vercel.
- Não gravar IP, user agent ou geolocalização de leads.
- Logs e Sentry: só campos permitidos (evento, nivel, request_id, lead_id, servico, codigo). Nunca nome, email, whatsapp, empresa, descrição, IP ou tokens. Erros de validação logam só **nomes** de campos.
- E-mails de notificação sem dados pessoais.
- Proibido `.or(` com template string no supabase-js (regra de lint).
- Logs só via `lib/logger.ts` (`log.info/aviso/erro`), que descarta campos fora da lista permitida. Nunca `console.*` com dados de lead.
- Zod só via `@/lib/validacao/zod` (configurado sem eval por causa da CSP; regra de lint).
- SEO: metadados de página indexável sempre por `metadadosPagina()` (`lib/seo.ts`); JSON-LD por `<JsonLd>`.
- Cabeçalhos e CSP em `lib/cabecalhos-seguranca.ts`. Mudou a CSP? Rode `e2e/seguranca.spec.ts` (detecta violações).
- Cookies de sessão: `httpOnly: true, secure: true, sameSite: 'lax'` explícitos.
- Headers de segurança e CSP (Report-Only nas páginas públicas) conforme `docs/decisoes.md`.
