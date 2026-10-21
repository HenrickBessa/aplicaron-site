-- asaas_eventos e sistema.registrar_evento_asaas: idempotência por ambiente, constraints e acesso.
begin;
select plan(12);

-- ---------------------------------------------------------------------------
-- Privilégios (os testes genéricos de 010 cobrem anon, DELETE e service_role em tabela)
-- ---------------------------------------------------------------------------
select table_privs_are('public', 'asaas_eventos', 'authenticated', array['SELECT'],
  'authenticated: só SELECT em asaas_eventos');

select col_hasnt_default('public', 'asaas_eventos', 'ambiente',
  'ambiente não tem default: toda gravação diz de qual ambiente veio');

-- ---------------------------------------------------------------------------
-- Idempotência por (ambiente, evento_id), como service_role (o role da chave secret)
-- ---------------------------------------------------------------------------
set local role service_role;

select is(sistema.registrar_evento_asaas('producao', 'evt_teste_1', 'PAYMENT_RECEIVED', 'pay_1'), true,
  'primeira chamada grava o evento');
select is(sistema.registrar_evento_asaas('producao', 'evt_teste_1', 'PAYMENT_RECEIVED', 'pay_1'), false,
  'o mesmo evento no mesmo ambiente não grava de novo (reenvio do Asaas)');
select is(sistema.registrar_evento_asaas('sandbox', 'evt_teste_1', 'PAYMENT_RECEIVED', 'pay_1'), true,
  'o mesmo id vindo do outro ambiente é outro evento e grava');
select is(sistema.registrar_evento_asaas('producao', 'evt_teste_2', 'PAYMENT_OVERDUE', 'pay_1'), true,
  'outro evento da mesma cobrança grava');

select throws_ok(
  $$ select sistema.registrar_evento_asaas('homologacao', 'evt_teste_3', 'PAYMENT_RECEIVED', 'pay_1') $$,
  '23514', null, 'ambiente fora de sandbox/producao é recusado'
);
select throws_ok(
  $$ select sistema.registrar_evento_asaas('producao', 'evt_teste_3', 'payment received', 'pay_1') $$,
  '23514', null, 'tipo fora do formato do Asaas é recusado'
);
select throws_ok(
  $$ select sistema.registrar_evento_asaas('producao', '', 'PAYMENT_RECEIVED', 'pay_1') $$,
  '23514', null, 'evento_id vazio é recusado'
);

reset role;

select results_eq(
  $$ select ambiente, evento_id, tipo, cobranca_id from public.asaas_eventos
      where evento_id like 'evt_teste_%' order by ambiente, evento_id $$,
  $$ values ('producao', 'evt_teste_1', 'PAYMENT_RECEIVED', 'pay_1'),
            ('producao', 'evt_teste_2', 'PAYMENT_OVERDUE', 'pay_1'),
            ('sandbox', 'evt_teste_1', 'PAYMENT_RECEIVED', 'pay_1') $$,
  'uma linha por (ambiente, evento), com os campos enviados'
);

-- ---------------------------------------------------------------------------
-- RLS: usuário logado que não é admin não vê nada; authenticated não executa a função
-- ---------------------------------------------------------------------------
insert into auth.users (id, email) values ('00000000-0000-0000-0000-00000000c070', 'comum070@teste.local');
set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub":"00000000-0000-0000-0000-00000000c070","role":"authenticated","aal":"aal2"}', true);

select is_empty('select 1 from public.asaas_eventos', 'usuário comum não enxerga eventos');
select throws_ok(
  $$ select sistema.registrar_evento_asaas('producao', 'evt_teste_4', 'PAYMENT_RECEIVED', 'pay_1') $$,
  '42501', null, 'authenticated não executa registrar_evento_asaas'
);

reset role;

select * from finish();
rollback;
