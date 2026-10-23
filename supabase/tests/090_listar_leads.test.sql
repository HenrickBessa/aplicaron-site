-- public.listar_leads(p_busca): busca do CRM por nome, e-mail ou empresa (migração 20261023120000).
begin;
delete from public.leads;
select plan(13);

-- ---------------------------------------------------------------------------
-- Dados (como postgres)
-- ---------------------------------------------------------------------------
insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000c002', 'comum2@teste.local'),
  ('00000000-0000-0000-0000-00000000a002', 'admin2@teste.local');
insert into public.admins (user_id) values ('00000000-0000-0000-0000-00000000a002');

insert into public.leads (submission_id, nome, email, empresa, servico, faixa_orcamento, descricao, politica_versao, status)
values
  (gen_random_uuid(), 'Ana Souza',  'ana@ex.com',     'Padaria 100%', 'sites',    'ate_5k',  'Quero um site novo', 'v1', 'novo'),
  (gen_random_uuid(), 'Bruno_Lima', 'bruno@acme.com', null,           'sistemas', 'nao_sei', 'Quero um sistema',   'v1', 'novo'),
  (gen_random_uuid(), 'Carla Dias', 'carla@ex.com',   'ACME Ltda',    'sites',    'ate_5k',  'Quero uma loja',     'v1', 'fechado');

select is(
  (select prosecdef from pg_proc where oid = 'public.listar_leads(text)'::regprocedure),
  false, 'listar_leads é SECURITY INVOKER (o RLS de quem chama vale)'
);

-- ---------------------------------------------------------------------------
-- Quem não é admin com MFA: zero linhas
-- ---------------------------------------------------------------------------
set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub":"00000000-0000-0000-0000-00000000c002","role":"authenticated","aal":"aal2"}', true);
select is_empty('select * from public.listar_leads()', 'comum: zero linhas');

select set_config('request.jwt.claims',
  '{"sub":"00000000-0000-0000-0000-00000000a002","role":"authenticated","aal":"aal1"}', true);
select is_empty($$ select * from public.listar_leads('ana') $$, 'admin aal1: zero linhas');

-- ---------------------------------------------------------------------------
-- Admin com aal2
-- ---------------------------------------------------------------------------
select set_config('request.jwt.claims',
  '{"sub":"00000000-0000-0000-0000-00000000a002","role":"authenticated","aal":"aal2"}', true);

select results_eq('select count(*)::int from public.listar_leads()', array[3], 'sem busca: todos');
select set_eq($$ select nome from public.listar_leads('ANA') $$, array['Ana Souza'],
  'busca no nome sem diferenciar maiúsculas');
select set_eq($$ select nome from public.listar_leads('acme') $$, array['Bruno_Lima', 'Carla Dias'],
  'busca no e-mail OU na empresa');
select set_eq($$ select nome from public.listar_leads('ex.com') $$, array['Ana Souza', 'Carla Dias'],
  'busca por parte do e-mail');
select set_eq($$ select nome from public.listar_leads('%') $$, array['Ana Souza'],
  '% digitado é texto, não curinga');
select set_eq($$ select nome from public.listar_leads('_') $$, array['Bruno_Lima'],
  '_ digitado é texto, não curinga');
select set_eq($$ select nome from public.listar_leads('\') $$, array[]::text[],
  'barra invertida digitada não quebra a busca');
select set_eq($$ select nome from public.listar_leads('ex.com') where status = 'fechado' $$, array['Carla Dias'],
  'filtros encadeados sobre o resultado (como o PostgREST faz)');

reset role;

-- ---------------------------------------------------------------------------
-- anon e service_role não executam
-- ---------------------------------------------------------------------------
set local role anon;
select throws_ok('select * from public.listar_leads()', '42501', null, 'anon: negado');
reset role;
set local role service_role;
select throws_ok('select * from public.listar_leads()', '42501', null, 'service_role: negado');
reset role;

select * from finish();
rollback;
