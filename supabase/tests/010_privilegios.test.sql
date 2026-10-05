-- Matriz de privilégios: quem pode o quê, independente de RLS.
-- Os testes genéricos (is_empty sobre o catálogo) também pegam tabelas e funções criadas no futuro.
begin;
select plan(29);

-- ---------------------------------------------------------------------------
-- Configuração geral
-- ---------------------------------------------------------------------------
select is_empty(
  $$ select c.relname from pg_class c
      where c.relnamespace = 'public'::regnamespace and c.relkind = 'r' and not c.relrowsecurity $$,
  'RLS ligada em todas as tabelas de public'
);

select is_empty(
  $$ select p.oid::regprocedure from pg_proc p
      where p.pronamespace in ('public'::regnamespace, 'privado'::regnamespace, 'sistema'::regnamespace)
        and p.prosecdef
        and not coalesce(p.proconfig @> array['search_path=""'], false) $$,
  'toda função SECURITY DEFINER tem search_path vazio'
);

-- ---------------------------------------------------------------------------
-- anon: nada
-- ---------------------------------------------------------------------------
select is_empty(
  $$ select c.oid::regclass from pg_class c
      where c.relnamespace in ('public'::regnamespace, 'privado'::regnamespace, 'sistema'::regnamespace)
        and c.relkind in ('r', 'v', 'm', 'S')
        and (has_table_privilege('anon', c.oid, 'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER')
             or has_any_column_privilege('anon', c.oid, 'SELECT,INSERT,UPDATE,REFERENCES')) $$,
  'anon não tem privilégio em nenhuma tabela, view ou sequência'
);

select is_empty(
  $$ select p.oid::regprocedure from pg_proc p
      where p.pronamespace in ('public'::regnamespace, 'privado'::regnamespace, 'sistema'::regnamespace)
        and has_function_privilege('anon', p.oid, 'EXECUTE') $$,
  'anon não executa nenhuma função de public, privado ou sistema'
);

select schema_privs_are('privado', 'anon', array[]::text[], 'anon sem USAGE em privado');
select schema_privs_are('sistema', 'anon', array[]::text[], 'anon sem USAGE em sistema');

-- ---------------------------------------------------------------------------
-- service_role: nenhuma tabela, só as funções de sistema
-- ---------------------------------------------------------------------------
select is_empty(
  $$ select c.oid::regclass from pg_class c
      where c.relnamespace in ('public'::regnamespace, 'privado'::regnamespace, 'sistema'::regnamespace)
        and c.relkind in ('r', 'v', 'm', 'S')
        and (has_table_privilege('service_role', c.oid, 'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER')
             or has_any_column_privilege('service_role', c.oid, 'SELECT,INSERT,UPDATE,REFERENCES')) $$,
  'service_role não tem privilégio em nenhuma tabela'
);

select set_eq(
  $$ select p.proname::text from pg_proc p
      where p.pronamespace in ('public'::regnamespace, 'privado'::regnamespace, 'sistema'::regnamespace)
        and has_function_privilege('service_role', p.oid, 'EXECUTE') $$,
  array['criar_lead', 'reivindicar_notificacoes', 'concluir_notificacao', 'anonimizar_vencidos'],
  'service_role executa exatamente as 4 funções de sistema'
);

select schema_privs_are('sistema', 'service_role', array['USAGE'], 'service_role tem USAGE em sistema');
select schema_privs_are('privado', 'service_role', array[]::text[], 'service_role sem USAGE em privado');

-- ---------------------------------------------------------------------------
-- authenticated: só o necessário para o admin (RLS restringe as linhas)
-- ---------------------------------------------------------------------------
select set_eq(
  $$ select p.oid::regprocedure::text from pg_proc p
      where p.pronamespace in ('public'::regnamespace, 'privado'::regnamespace, 'sistema'::regnamespace)
        and has_function_privilege('authenticated', p.oid, 'EXECUTE') $$,
  array['privado.admin_mfa()'],
  'authenticated executa só privado.admin_mfa()'
);

select schema_privs_are('privado', 'authenticated', array['USAGE'], 'authenticated tem USAGE em privado');
select schema_privs_are('sistema', 'authenticated', array[]::text[], 'authenticated sem USAGE em sistema');

-- leads: SELECT na tabela; UPDATE só na coluna status
select table_privs_are('public', 'leads', 'authenticated', array['SELECT'],
  'authenticated: só SELECT na tabela leads (sem INSERT, sem DELETE)');
select column_privs_are('public', 'leads', 'status', 'authenticated', array['SELECT', 'UPDATE'],
  'authenticated: UPDATE em leads.status');
select column_privs_are('public', 'leads', 'nome', 'authenticated', array['SELECT'],
  'authenticated: sem UPDATE em leads.nome');
select column_privs_are('public', 'leads', 'email', 'authenticated', array['SELECT'],
  'authenticated: sem UPDATE em leads.email');
select column_privs_are('public', 'leads', 'versao', 'authenticated', array['SELECT'],
  'authenticated: sem UPDATE em leads.versao');
select column_privs_are('public', 'leads', 'notificacao_status', 'authenticated', array['SELECT'],
  'authenticated: sem UPDATE em leads.notificacao_status');

-- lead_notas: SELECT; INSERT só em lead_id e texto
select table_privs_are('public', 'lead_notas', 'authenticated', array['SELECT'],
  'authenticated: só SELECT na tabela lead_notas');
select column_privs_are('public', 'lead_notas', 'lead_id', 'authenticated', array['INSERT', 'SELECT'],
  'authenticated: INSERT em lead_notas.lead_id');
select column_privs_are('public', 'lead_notas', 'texto', 'authenticated', array['INSERT', 'SELECT'],
  'authenticated: INSERT em lead_notas.texto');
select column_privs_are('public', 'lead_notas', 'autor_id', 'authenticated', array['SELECT'],
  'authenticated: sem INSERT em lead_notas.autor_id');

-- histórico e admins
select table_privs_are('public', 'lead_status_historico', 'authenticated', array['SELECT'],
  'authenticated: só SELECT no histórico');
select is_empty(
  $$ select 1 where has_any_column_privilege('authenticated', 'public.lead_status_historico', 'INSERT,UPDATE') $$,
  'authenticated: sem INSERT/UPDATE em nenhuma coluna do histórico'
);
select table_privs_are('public', 'admins', 'authenticated', array[]::text[],
  'authenticated: nada em admins');

-- ---------------------------------------------------------------------------
-- DELETE: ninguém
-- ---------------------------------------------------------------------------
select is_empty(
  $$ select c.oid::regclass, r.rolname from pg_class c
      cross join (values ('anon'), ('authenticated'), ('service_role')) as r(rolname)
      where c.relnamespace = 'public'::regnamespace and c.relkind = 'r'
        and has_table_privilege(r.rolname, c.oid, 'DELETE,TRUNCATE') $$,
  'nenhum role da API tem DELETE ou TRUNCATE'
);

-- ---------------------------------------------------------------------------
-- Na prática: anon recebe "permission denied"
-- ---------------------------------------------------------------------------
set local role anon;
select throws_ok('select * from public.leads', '42501', null, 'anon: SELECT em leads é negado');
select throws_ok(
  $$ select * from sistema.criar_lead(gen_random_uuid(), 'Ana', 'ana@ex.com', null, null,
       'sites', 'ate_5k', 'Quero um site novo', 'v1', false) $$,
  '42501', null, 'anon: sistema.criar_lead é negado'
);
reset role;

select * from finish();
rollback;
