-- Fila de notificação: reivindicar_notificacoes e concluir_notificacao.
-- Aqui testamos as regras em uma única sessão. A concorrência real (duas sessões ao mesmo
-- tempo devolvendo conjuntos disjuntos) é testada na fatia 5, com duas conexões.
begin;
-- Isola o teste de dados que já existam no banco local (ex.: deixados pelos testes E2E).
-- Tudo volta ao estado anterior no rollback do fim do arquivo.
delete from public.leads;
select plan(21);

-- ---------------------------------------------------------------------------
-- Cenário (como postgres)
-- ---------------------------------------------------------------------------
--  A  pendente, venceu há 10 min                       -> elegível
--  B  falhou 1x, próxima venceu há 1 min               -> elegível
--  C  já enviada                                       -> fora
--  D  próxima só daqui a 1 h                           -> fora
--  E  5 tentativas (limite)                            -> fora
--  F  travada por outro worker até daqui a 1 min       -> fora
--  G  pendente (usado para reivindicar um lead específico)
--  H  2 tentativas, trava de worker morto já vencida   -> elegível
insert into public.leads
  (id, submission_id, nome, email, servico, faixa_orcamento, descricao, politica_versao,
   notificacao_status, notificacao_tentativas, notificacao_proxima_em, notificacao_travada_ate)
select v.id::uuid, gen_random_uuid(), 'Lead ' || v.rotulo, lower(v.rotulo) || '@ex.com',
       'sites', 'ate_5k', 'Descrição de teste', 'v1',
       v.status::public.notificacao_estado, v.tentativas, v.proxima, v.travada
  from (values
    ('00000000-0000-0000-0000-00000000000a', 'A', 'pendente', 0, now() - interval '10 minutes', null::timestamptz),
    ('00000000-0000-0000-0000-00000000000b', 'B', 'falhou',   1, now() - interval '1 minute',   null),
    ('00000000-0000-0000-0000-00000000000c', 'C', 'enviada',  1, null,                          null),
    ('00000000-0000-0000-0000-00000000000d', 'D', 'falhou',   1, now() + interval '1 hour',     null),
    ('00000000-0000-0000-0000-00000000000e', 'E', 'falhou',   5, now() - interval '1 minute',   null),
    ('00000000-0000-0000-0000-00000000000f', 'F', 'pendente', 1, now() - interval '5 minutes',  now() + interval '1 minute'),
    ('00000000-0000-0000-0000-000000000007', 'G', 'pendente', 0, now() - interval '5 minutes',  null),
    ('00000000-0000-0000-0000-000000000008', 'H', 'pendente', 2, now() - interval '30 minutes', now() - interval '1 minute')
  ) as v(id, rotulo, status, tentativas, proxima, travada);

set local role service_role;

-- ---------------------------------------------------------------------------
-- Reivindicar
-- ---------------------------------------------------------------------------
select results_eq(
  $$ select id, tentativa::int, servico::text, faixa_orcamento::text
       from sistema.reivindicar_notificacoes(10, '00000000-0000-0000-0000-000000000007') $$,
  $$ values ('00000000-0000-0000-0000-000000000007'::uuid, 1, 'sites', 'ate_5k') $$,
  'com p_lead_id reivindica só aquele lead, devolvendo serviço e faixa (sem dados pessoais)'
);

select set_eq(
  $$ select id, tentativa::int from sistema.reivindicar_notificacoes(10) $$,
  $$ values ('00000000-0000-0000-0000-00000000000a'::uuid, 1),
            ('00000000-0000-0000-0000-00000000000b'::uuid, 2),
            ('00000000-0000-0000-0000-000000000008'::uuid, 3) $$,
  'reivindica só os elegíveis (A, B, H) e incrementa a tentativa'
);

select is_empty(
  'select * from sistema.reivindicar_notificacoes(10)',
  'nova reivindicação não devolve linhas já travadas'
);

reset role;

select results_eq(
  $$ select count(*)::int from public.leads
      where notificacao_travada_ate = now() + interval '2 minutes' $$,
  array[4],
  'linhas reivindicadas ficam travadas por 2 minutos (G, A, B, H)'
);

select results_eq(
  $$ select notificacao_tentativas::int, notificacao_travada_ate > now()
       from public.leads where id = '00000000-0000-0000-0000-00000000000f' $$,
  $$ values (1, true) $$,
  'linha travada por outro worker não é tocada'
);

-- Limite do lote
insert into public.leads (id, submission_id, nome, email, servico, faixa_orcamento, descricao, politica_versao)
values ('00000000-0000-0000-0000-000000000009', gen_random_uuid(), 'Lead I', 'i@ex.com', 'sites', 'ate_5k', 'Descrição de teste', 'v1'),
       ('00000000-0000-0000-0000-000000000010', gen_random_uuid(), 'Lead J', 'j@ex.com', 'sites', 'ate_5k', 'Descrição de teste', 'v1');

set local role service_role;

select results_eq(
  'select count(*)::int from sistema.reivindicar_notificacoes(1)',
  array[1],
  'p_limite = 1 devolve no máximo 1 linha'
);

select is_empty(
  'select * from sistema.reivindicar_notificacoes(0)',
  'p_limite = 0 não devolve nada'
);

-- ---------------------------------------------------------------------------
-- Concluir com sucesso
-- ---------------------------------------------------------------------------
select is(
  sistema.concluir_notificacao('00000000-0000-0000-0000-00000000000a', 99, true),
  false,
  'tentativa que não é a atual é descartada'
);

select is(
  sistema.concluir_notificacao('00000000-0000-0000-0000-00000000000a', 1, true),
  true,
  'tentativa atual com sucesso é gravada'
);

select is(
  sistema.concluir_notificacao('00000000-0000-0000-0000-00000000000a', 1, true),
  false,
  'concluir de novo uma notificação já enviada não grava nada'
);

reset role;

select results_eq(
  $$ select notificacao_status::text, notificacao_proxima_em is null, notificacao_travada_ate is null
       from public.leads where id = '00000000-0000-0000-0000-00000000000a' $$,
  $$ values ('enviada', true, true) $$,
  'sucesso: enviada, sem próxima tentativa, trava liberada'
);

-- ---------------------------------------------------------------------------
-- Falhas e backoff: 5min, 15min, 1h, 6h, 24h; após a 5ª, sem próxima
-- ---------------------------------------------------------------------------
-- Prepara K (4ª tentativa em andamento) e põe E com a 5ª em andamento.
insert into public.leads
  (id, submission_id, nome, email, servico, faixa_orcamento, descricao, politica_versao,
   notificacao_tentativas, notificacao_travada_ate)
values ('00000000-0000-0000-0000-000000000011', gen_random_uuid(), 'Lead K', 'k@ex.com',
        'sites', 'ate_5k', 'Descrição de teste', 'v1', 4, now() + interval '2 minutes');
update public.leads set notificacao_travada_ate = now() + interval '2 minutes'
 where id = '00000000-0000-0000-0000-00000000000e';

set local role service_role;

select is(sistema.concluir_notificacao('00000000-0000-0000-0000-000000000007', 1, false, 'timeout'), true,
  'falha na 1ª tentativa (G) é gravada');
select is(sistema.concluir_notificacao('00000000-0000-0000-0000-00000000000b', 2, false, 'http_500'), true,
  'falha na 2ª tentativa (B) é gravada');
select is(sistema.concluir_notificacao('00000000-0000-0000-0000-000000000008', 3, false), true,
  'falha na 3ª tentativa (H) é gravada');
select is(sistema.concluir_notificacao('00000000-0000-0000-0000-000000000011', 4, false), true,
  'falha na 4ª tentativa (K) é gravada');
select is(sistema.concluir_notificacao('00000000-0000-0000-0000-00000000000e', 5, false), true,
  'falha na 5ª tentativa (E) é gravada');

reset role;

select results_eq(
  $$ select id, notificacao_status::text, notificacao_proxima_em - now(), notificacao_travada_ate is null
       from public.leads
      where id in ('00000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-00000000000b',
                   '00000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000011')
      order by notificacao_tentativas $$,
  $$ values ('00000000-0000-0000-0000-000000000007'::uuid, 'falhou', interval '5 minutes',  true),
            ('00000000-0000-0000-0000-00000000000b'::uuid, 'falhou', interval '15 minutes', true),
            ('00000000-0000-0000-0000-000000000008'::uuid, 'falhou', interval '1 hour',     true),
            ('00000000-0000-0000-0000-000000000011'::uuid, 'falhou', interval '6 hours',    true) $$,
  'backoff após falha nas tentativas 1 a 4: 5min, 15min, 1h, 6h'
);

select results_eq(
  $$ select notificacao_status::text, notificacao_proxima_em is null
       from public.leads where id = '00000000-0000-0000-0000-00000000000e' $$,
  $$ values ('falhou', true) $$,
  'após a 5ª falha não há próxima tentativa'
);

-- Falhas reagendadas não voltam antes da hora: sobra só o lead I ou J não reivindicado.
set local role service_role;
select results_eq(
  'select count(*)::int from sistema.reivindicar_notificacoes(10)',
  array[1],
  'falhas reagendadas para o futuro não são reivindicadas antes da hora'
);
reset role;

-- ---------------------------------------------------------------------------
-- Só service_role chama
-- ---------------------------------------------------------------------------
set local role authenticated;
select throws_ok('select * from sistema.reivindicar_notificacoes(10)', '42501', null,
  'authenticated não chama reivindicar_notificacoes');
select throws_ok(
  $$ select sistema.concluir_notificacao('00000000-0000-0000-0000-00000000000a', 1, true) $$,
  '42501', null, 'authenticated não chama concluir_notificacao');
reset role;

select * from finish();
rollback;
