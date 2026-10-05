-- sistema.anonimizar_vencidos: retenção LGPD.
-- Regra: sem atividade há mais de 12 meses e status <> 'fechado'.
begin;
-- Isola o teste de dados que já existam no banco local (ex.: deixados pelos testes E2E).
-- Tudo volta ao estado anterior no rollback do fim do arquivo.
delete from public.leads;
select plan(9);

-- ---------------------------------------------------------------------------
-- Cenário
-- ---------------------------------------------------------------------------
--  X  perdido, parado há 13 meses, com nota  -> anonimiza
--  Y  fechado (cliente), parado há 13 meses  -> mantém
--  Z  novo, parado há 11 meses               -> mantém
insert into public.leads
  (id, submission_id, created_at, nome, email, whatsapp, empresa, servico, faixa_orcamento, descricao,
   status, pagina_origem, utm_source, utm_medium, utm_campaign, politica_versao, marketing_optin, marketing_optin_em)
values
  ('00000000-0000-0000-0000-0000000000a1', gen_random_uuid(), '2025-03-15 14:30:00+00',
   'Ana Souza', 'ana@ex.com', '+5511987654321', 'ACME', 'aplicativos', 'acima_50k', 'Quero um app de entregas',
   'perdido', '/servicos/aplicativos', 'google', 'cpc', 'campanha-ana', 'v1', true, '2025-03-15 14:30:00+00'),
  ('00000000-0000-0000-0000-0000000000b1', gen_random_uuid(), '2025-03-15 14:30:00+00',
   'Bruno Lima', 'bruno@ex.com', null, null, 'sites', 'ate_5k', 'Site institucional simples',
   'novo', null, null, null, null, 'v1', false, null),
  ('00000000-0000-0000-0000-0000000000c1', gen_random_uuid(), '2025-03-15 14:30:00+00',
   'Carla Dias', 'carla@ex.com', null, null, 'sistemas', 'nao_sei', 'Sistema de agendamento',
   'novo', null, null, null, null, 'v1', false, null);

-- Y vira cliente pelo fluxo normal (status 'fechado').
update public.leads set status = 'fechado' where id = '00000000-0000-0000-0000-0000000000b1';

insert into public.lead_notas (lead_id, texto)
values ('00000000-0000-0000-0000-0000000000a1', 'Cliente disse que vai pensar');

-- Envelhece a atividade depois da nota (a nota marca atividade = now()).
update public.leads set ultima_atividade_em = now() - interval '13 months'
 where id in ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000b1');
update public.leads set ultima_atividade_em = now() - interval '11 months'
 where id = '00000000-0000-0000-0000-0000000000c1';

-- ---------------------------------------------------------------------------
-- Execução
-- ---------------------------------------------------------------------------
set local role service_role;
select is(sistema.anonimizar_vencidos(), 1, 'anonimiza exatamente 1 lead');
reset role;

select results_eq(
  $$ select nome, email, whatsapp, empresa, descricao, utm_campaign, anonimizado_em = now()
       from public.leads where id = '00000000-0000-0000-0000-0000000000a1' $$,
  $$ values ('[removido]', null::text, null::text, null::text, '[removido]', null::text, true) $$,
  'zera nome, email, whatsapp, empresa, descrição e utm_campaign e marca anonimizado_em'
);

select results_eq(
  $$ select created_at from public.leads where id = '00000000-0000-0000-0000-0000000000a1' $$,
  $$ values ('2025-03-01 00:00:00+00'::timestamptz) $$,
  'created_at truncado ao mês'
);

select results_eq(
  $$ select status::text, servico::text, faixa_orcamento::text, pagina_origem, utm_source, utm_medium
       from public.leads where id = '00000000-0000-0000-0000-0000000000a1' $$,
  $$ values ('perdido', 'aplicativos', 'acima_50k', '/servicos/aplicativos', 'google', 'cpc') $$,
  'preserva status, serviço, faixa e origem não identificável'
);

select is_empty(
  $$ select 1 from public.lead_notas where lead_id = '00000000-0000-0000-0000-0000000000a1' $$,
  'apaga as notas do lead anonimizado'
);

select results_eq(
  $$ select nome, email from public.leads where id = '00000000-0000-0000-0000-0000000000b1' $$,
  $$ values ('Bruno Lima', 'bruno@ex.com') $$,
  'lead fechado (cliente) não é anonimizado'
);

select results_eq(
  $$ select nome, email from public.leads where id = '00000000-0000-0000-0000-0000000000c1' $$,
  $$ values ('Carla Dias', 'carla@ex.com') $$,
  'lead com atividade há menos de 12 meses não é anonimizado'
);

set local role service_role;
select is(sistema.anonimizar_vencidos(), 0, 'segunda execução não anonimiza de novo');
reset role;

set local role authenticated;
select throws_ok('select sistema.anonimizar_vencidos()', '42501', null,
  'authenticated não chama anonimizar_vencidos');
reset role;

select * from finish();
rollback;
