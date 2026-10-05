-- RLS: o que cada perfil autenticado enxerga e consegue alterar.
-- Simulamos o PostgREST: trocamos para o role authenticated e definimos as claims do JWT.
--   comum = usuário logado que não está em public.admins
--   admin = usuário em public.admins (testado com aal1 e aal2)
begin;
select plan(26);

-- ---------------------------------------------------------------------------
-- Dados (como postgres, dono das tabelas)
-- ---------------------------------------------------------------------------
insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000c001', 'comum@teste.local'),
  ('00000000-0000-0000-0000-00000000a001', 'admin@teste.local');
insert into public.admins (user_id) values ('00000000-0000-0000-0000-00000000a001');

insert into public.leads (id, submission_id, nome, email, servico, faixa_orcamento, descricao, politica_versao)
values ('00000000-0000-0000-0000-0000000001ee', gen_random_uuid(), 'Ana Souza', 'ana@ex.com',
        'sites', 'ate_5k', 'Quero um site institucional', 'v1');
insert into public.lead_notas (lead_id, texto, autor_id)
values ('00000000-0000-0000-0000-0000000001ee', 'Primeiro contato', '00000000-0000-0000-0000-00000000a001');
update public.leads set status = 'em_contato' where id = '00000000-0000-0000-0000-0000000001ee';

-- ---------------------------------------------------------------------------
-- Usuário comum (mesmo com aal2): zero linhas
-- ---------------------------------------------------------------------------
set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub":"00000000-0000-0000-0000-00000000c001","role":"authenticated","aal":"aal2"}', true);

select is_empty('select * from public.leads', 'comum: não vê leads');
select is_empty('select * from public.lead_notas', 'comum: não vê notas');
select is_empty('select * from public.lead_status_historico', 'comum: não vê histórico');
select is_empty($$ update public.leads set status = 'perdido' returning id $$,
  'comum: UPDATE de status não atinge nenhuma linha');
select throws_ok(
  $$ insert into public.lead_notas (lead_id, texto) values ('00000000-0000-0000-0000-0000000001ee', 'x') $$,
  '42501', null, 'comum: INSERT de nota é barrado pelo RLS');
select throws_ok('select * from public.admins', '42501', null, 'comum: não lê admins');

-- ---------------------------------------------------------------------------
-- Admin com aal1 (logou só com senha, sem o segundo fator): zero linhas
-- ---------------------------------------------------------------------------
select set_config('request.jwt.claims',
  '{"sub":"00000000-0000-0000-0000-00000000a001","role":"authenticated","aal":"aal1"}', true);

select is_empty('select * from public.leads', 'admin aal1: não vê leads');
select is_empty('select * from public.lead_notas', 'admin aal1: não vê notas');
select is_empty('select * from public.lead_status_historico', 'admin aal1: não vê histórico');
select is_empty($$ update public.leads set status = 'perdido' returning id $$,
  'admin aal1: UPDATE de status não atinge nenhuma linha');
select throws_ok(
  $$ insert into public.lead_notas (lead_id, texto) values ('00000000-0000-0000-0000-0000000001ee', 'x') $$,
  '42501', null, 'admin aal1: INSERT de nota é barrado pelo RLS');

-- ---------------------------------------------------------------------------
-- Admin com aal2: acesso conforme os grants
-- ---------------------------------------------------------------------------
select set_config('request.jwt.claims',
  '{"sub":"00000000-0000-0000-0000-00000000a001","role":"authenticated","aal":"aal2"}', true);

select results_eq('select count(*)::int from public.leads', array[1], 'admin aal2: vê leads');
select results_eq('select count(*)::int from public.lead_notas', array[1], 'admin aal2: vê notas');
select results_eq('select count(*)::int from public.lead_status_historico', array[1], 'admin aal2: vê histórico');

select results_eq(
  $$ update public.leads set status = 'proposta_enviada'
      where id = '00000000-0000-0000-0000-0000000001ee' returning status::text $$,
  array['proposta_enviada'],
  'admin aal2: altera status'
);

select results_eq(
  $$ insert into public.lead_notas (lead_id, texto)
     values ('00000000-0000-0000-0000-0000000001ee', 'Enviei a proposta') returning autor_id $$,
  array['00000000-0000-0000-0000-00000000a001'::uuid],
  'admin aal2: insere nota e autor_id vem do JWT'
);

-- O que o admin NÃO pode, mesmo com aal2:
select throws_ok($$ update public.leads set nome = 'Outro' $$, '42501', null,
  'admin aal2: não altera nome');
select throws_ok($$ update public.leads set email = 'outro@ex.com' $$, '42501', null,
  'admin aal2: não altera email');
select throws_ok($$ update public.leads set versao = 99 $$, '42501', null,
  'admin aal2: não altera versao diretamente');
select throws_ok($$ update public.leads set notificacao_status = 'enviada' $$, '42501', null,
  'admin aal2: não mexe na fila de notificação');
select throws_ok(
  $$ insert into public.lead_status_historico (lead_id, status_anterior, status_novo)
     values ('00000000-0000-0000-0000-0000000001ee', 'novo', 'fechado') $$,
  '42501', null, 'admin aal2: não insere no histórico');
select throws_ok(
  $$ insert into public.lead_notas (lead_id, texto, autor_id)
     values ('00000000-0000-0000-0000-0000000001ee', 'x', '00000000-0000-0000-0000-00000000c001') $$,
  '42501', null, 'admin aal2: não forja autor_id da nota');
select throws_ok($$ insert into public.leads (submission_id, nome, email, servico, faixa_orcamento, descricao, politica_versao)
     values (gen_random_uuid(), 'Bia', 'bia@ex.com', 'sites', 'ate_5k', 'descricao longa', 'v1') $$,
  '42501', null, 'admin aal2: não cria lead');
select throws_ok('delete from public.leads', '42501', null, 'admin aal2: não apaga leads');
select throws_ok('delete from public.lead_notas', '42501', null, 'admin aal2: não apaga notas');
select throws_ok('select * from public.admins', '42501', null, 'admin aal2: não lê admins');

reset role;

select * from finish();
rollback;
