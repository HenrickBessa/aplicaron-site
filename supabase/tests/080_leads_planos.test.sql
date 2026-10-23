-- Leads da página /planos: plano, add-ons, cidade e segmento (migração 20261023050000).
begin;
delete from public.leads;
select plan(9);

set local role service_role;

create temporary table plano as
  select * from sistema.criar_lead(
    'bbbbbbbb-0000-0000-0000-000000000001', 'Carla Dias', 'carla@ex.com', null, 'Clínica X',
    'sites', null, 'Site com agendamento e catálogo', 'v1', false,
    '/planos', null, null, null,
    'vende', array['manutencao_4h', 'crm', 'crm']::public.addon_tipo[], 'Rio Branco/AC', 'saúde'
  );
reset role;

select results_eq(
  $$ select plano_interesse::text, addons::text[], cidade, segmento, faixa_orcamento is null
       from public.leads where id = (select id from plano) $$,
  $$ values ('vende', array['crm', 'manutencao_4h'], 'Rio Branco/AC', 'saúde', true) $$,
  'lead de plano grava plano, add-ons sem repetição, cidade e segmento, sem faixa'
);

set local role service_role;
create temporary table diagnostico as
  select * from sistema.criar_lead(
    'bbbbbbbb-0000-0000-0000-000000000002', 'Davi Melo', 'davi@ex.com', null, null,
    'sistemas', 'nao_sei', 'Quero um sistema interno', 'v1', false);
reset role;

select results_eq(
  $$ select plano_interesse is null, addons, cidade is null from public.leads where id = (select id from diagnostico) $$,
  $$ values (true, '{}'::public.addon_tipo[], true) $$,
  'lead de diagnóstico sem os campos novos continua como antes'
);

set local role service_role;
select throws_ok(
  $$ select * from sistema.criar_lead(gen_random_uuid(), 'Ana', 'ana@ex.com', null, null,
       'sites', null, 'Descrição válida', 'v1', false) $$,
  '23514', null, 'sem faixa E sem plano é rejeitado');
select throws_ok(
  $$ select * from sistema.criar_lead(gen_random_uuid(), 'Ana', 'ana@ex.com', null, null,
       'sites', null, 'Descrição válida', 'v1', false, null, null, null, null,
       'presenca', '{}', repeat('x', 81), null) $$,
  '23514', null, 'cidade com mais de 80 caracteres é rejeitada');
select throws_ok(
  $$ select * from sistema.criar_lead(gen_random_uuid(), 'Ana', 'ana@ex.com', null, null,
       'sites', null, 'Descrição válida', 'v1', false, null, null, null, null,
       'presenca', '{}', null, repeat('x', 81)) $$,
  '23514', null, 'segmento com mais de 80 caracteres é rejeitado');
select throws_ok(
  $$ select * from sistema.criar_lead(gen_random_uuid(), 'Ana', 'ana@ex.com', null, null,
       'sites', null, 'Descrição válida', 'v1', false, null, null, null, null,
       'premium', '{}', null, null) $$,
  '22P02', null, 'plano fora da lista é rejeitado');

select results_eq(
  $$ select plano_interesse::text, faixa_orcamento is null
       from sistema.reivindicar_notificacoes(1, (select id from plano)) $$,
  $$ values ('vende', true) $$,
  'reivindicar_notificacoes devolve o plano (assunto do e-mail), sem dados pessoais'
);
reset role;

-- Anonimização: cidade sai; plano, add-ons e segmento ficam para estatística.
update public.leads set ultima_atividade_em = now() - interval '13 months' where id = (select id from plano);
set local role service_role;
select sistema.anonimizar_vencidos();
reset role;

select results_eq(
  $$ select cidade is null, empresa is null, plano_interesse::text, addons::text[], segmento
       from public.leads where id = (select id from plano) $$,
  $$ values (true, true, 'vende', array['crm', 'manutencao_4h'], 'saúde') $$,
  'anonimizar apaga a cidade e preserva plano, add-ons e segmento'
);

set local role authenticated;
select throws_ok(
  $$ select * from sistema.criar_lead(gen_random_uuid(), 'Ana', 'ana@ex.com', null, null,
       'sites', null, 'Descrição válida', 'v1', false, null, null, null, null,
       'presenca', '{}', null, null) $$,
  '42501', null, 'authenticated não chama a nova criar_lead');
reset role;

select * from finish();
rollback;
