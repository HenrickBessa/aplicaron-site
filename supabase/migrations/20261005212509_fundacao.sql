-- Fundação: privilégios padrão, schemas e enums.
-- Princípio: nada é acessível por padrão. Todo acesso é concedido explicitamente nas migrações seguintes.

-- ---------------------------------------------------------------------------
-- 1. Privilégios padrão
-- ---------------------------------------------------------------------------
-- O Supabase configura o schema public para que todo objeto criado pelo postgres
-- ganhe ALL para anon, authenticated e service_role. Desligamos isso.
alter default privileges for role postgres in schema public
  revoke all on tables from anon, authenticated, service_role, public;
alter default privileges for role postgres in schema public
  revoke all on sequences from anon, authenticated, service_role, public;
alter default privileges for role postgres in schema public
  revoke all on functions from anon, authenticated, service_role, public;

-- O Postgres concede EXECUTE a PUBLIC em toda função nova, em qualquer schema.
-- Essa regra é global, e um REVOKE por schema não a remove; por isso a revogação global.
alter default privileges for role postgres
  revoke execute on functions from public;

-- ---------------------------------------------------------------------------
-- 2. Schemas
-- ---------------------------------------------------------------------------
-- privado: helpers de autorização e funções de trigger. NÃO é exposto na Data API.
-- authenticated precisa de USAGE para as políticas RLS chamarem privado.admin_mfa().
create schema privado;
revoke all on schema privado from public;
grant usage on schema privado to authenticated;

-- sistema: funções chamadas pelo servidor com a chave secret (role service_role).
-- É exposto na Data API (para o supabase-js chamar via RPC), mas só service_role tem USAGE.
create schema sistema;
revoke all on schema sistema from public;
grant usage on schema sistema to service_role;

-- ---------------------------------------------------------------------------
-- 3. Enums
-- ---------------------------------------------------------------------------
create type public.lead_status as enum
  ('novo', 'em_contato', 'proposta_enviada', 'fechado', 'perdido');

create type public.servico_tipo as enum
  ('automacao_ia', 'sites', 'sistemas', 'aplicativos', 'outro');

create type public.orcamento_faixa as enum
  ('ate_5k', '5k_15k', '15k_50k', 'acima_50k', 'nao_sei');

create type public.notificacao_estado as enum
  ('pendente', 'enviada', 'falhou');
