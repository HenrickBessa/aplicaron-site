-- sistema.criar_lead: idempotência, consentimento, defaults da fila e constraints.
-- Chamado como service_role, que é o role da chave secret usada pelo servidor.
begin;
-- Isola o teste de dados que já existam no banco local (ex.: deixados pelos testes E2E).
-- Tudo volta ao estado anterior no rollback do fim do arquivo.
delete from public.leads;
select plan(17);

set local role service_role;

-- ---------------------------------------------------------------------------
-- Idempotência pelo submission_id
-- ---------------------------------------------------------------------------
create temporary table primeira as
  select * from sistema.criar_lead(
    'aaaaaaaa-0000-0000-0000-000000000001', 'Ana Souza', 'ana@ex.com', '+5511987654321', 'ACME',
    'automacao_ia', '5k_15k', 'Quero automatizar o atendimento', 'v1', false,
    '/servicos/automacao-ia', 'google', 'cpc', 'lancamento'
  );

select results_eq('select criado from primeira', array[true], 'primeira chamada cria o lead (criado = true)');

select results_eq(
  $$ select r.criado, r.id = (select id from primeira)
       from sistema.criar_lead(
         'aaaaaaaa-0000-0000-0000-000000000001', 'Ana Souza', 'ana@ex.com', '+5511987654321', 'ACME',
         'automacao_ia', '5k_15k', 'Quero automatizar o atendimento', 'v1', false) r $$,
  $$ values (false, true) $$,
  'chamada repetida com o mesmo submission_id devolve criado = false e o mesmo id'
);

reset role;

select results_eq(
  $$ select count(*)::int from public.leads where submission_id = 'aaaaaaaa-0000-0000-0000-000000000001' $$,
  array[1],
  'só existe um lead para o submission_id'
);

select results_eq(
  $$ select nome, email, whatsapp, empresa, servico::text, faixa_orcamento::text,
            pagina_origem, utm_source, utm_medium, utm_campaign, politica_versao
       from public.leads where id = (select id from primeira) $$,
  $$ values ('Ana Souza', 'ana@ex.com', '+5511987654321', 'ACME', 'automacao_ia', '5k_15k',
             '/servicos/automacao-ia', 'google', 'cpc', 'lancamento', 'v1') $$,
  'campos gravados como enviados'
);

select results_eq(
  $$ select status::text, versao, notificacao_status::text, notificacao_tentativas::int,
            notificacao_proxima_em = now(), notificacao_travada_ate is null
       from public.leads where id = (select id from primeira) $$,
  $$ values ('novo', 1, 'pendente', 0, true, true) $$,
  'lead nasce como novo, versão 1 e na fila de notificação para agora'
);

select results_eq(
  $$ select marketing_optin, marketing_optin_em is null
       from public.leads where id = (select id from primeira) $$,
  $$ values (false, true) $$,
  'sem opt-in de marketing: sem data de consentimento'
);

-- ---------------------------------------------------------------------------
-- Opt-in de marketing grava a data
-- ---------------------------------------------------------------------------
set local role service_role;
create temporary table com_optin as
  select * from sistema.criar_lead(
    'aaaaaaaa-0000-0000-0000-000000000002', 'Bruno Lima', 'bruno@ex.com', null, null,
    'sites', 'nao_sei', 'Quero um site para minha loja', 'v1', true);
reset role;

select results_eq(
  $$ select marketing_optin, marketing_optin_em = now(), whatsapp is null, empresa is null
       from public.leads where id = (select id from com_optin) $$,
  $$ values (true, true, true, true) $$,
  'opt-in marcado grava marketing_optin_em; whatsapp e empresa são opcionais'
);

-- ---------------------------------------------------------------------------
-- Constraints rejeitam dados inválidos (o banco é a última linha de defesa)
-- ---------------------------------------------------------------------------
set local role service_role;

select throws_ok(
  $$ select * from sistema.criar_lead(gen_random_uuid(), 'Ana', 'Ana@Ex.com', null, null,
       'sites', 'ate_5k', 'Descrição válida', 'v1', false) $$,
  '23514', null, 'email com maiúsculas é rejeitado');
select throws_ok(
  $$ select * from sistema.criar_lead(gen_random_uuid(), 'Ana', 'ana-sem-arroba', null, null,
       'sites', 'ate_5k', 'Descrição válida', 'v1', false) $$,
  '23514', null, 'email sem formato válido é rejeitado');
select throws_ok(
  $$ select * from sistema.criar_lead(gen_random_uuid(), 'Ana', null, null, null,
       'sites', 'ate_5k', 'Descrição válida', 'v1', false) $$,
  '23514', null, 'email nulo é rejeitado em lead não anonimizado');
select throws_ok(
  $$ select * from sistema.criar_lead(gen_random_uuid(), 'Ana', 'ana@ex.com', '11987654321', null,
       'sites', 'ate_5k', 'Descrição válida', 'v1', false) $$,
  '23514', null, 'whatsapp fora do E.164 é rejeitado');
select throws_ok(
  $$ select * from sistema.criar_lead(gen_random_uuid(), 'A', 'ana@ex.com', null, null,
       'sites', 'ate_5k', 'Descrição válida', 'v1', false) $$,
  '23514', null, 'nome com menos de 2 caracteres é rejeitado');
select throws_ok(
  $$ select * from sistema.criar_lead(gen_random_uuid(), 'Ana', 'ana@ex.com', null, null,
       'sites', 'ate_5k', 'curta', 'v1', false) $$,
  '23514', null, 'descrição com menos de 10 caracteres é rejeitada');
select throws_ok(
  $$ select * from sistema.criar_lead(gen_random_uuid(), 'Ana', 'ana@ex.com', null, repeat('x', 121),
       'sites', 'ate_5k', 'Descrição válida', 'v1', false) $$,
  '23514', null, 'empresa com mais de 120 caracteres é rejeitada');
select throws_ok(
  $$ select * from sistema.criar_lead(gen_random_uuid(), 'Ana', 'ana@ex.com', null, null,
       'sites', 'ate_5k', 'Descrição válida', null, false) $$,
  '23502', null, 'politica_versao é obrigatória');

reset role;

-- ---------------------------------------------------------------------------
-- Só service_role chama
-- ---------------------------------------------------------------------------
set local role authenticated;
select throws_ok(
  $$ select * from sistema.criar_lead(gen_random_uuid(), 'Ana', 'ana@ex.com', null, null,
       'sites', 'ate_5k', 'Descrição válida', 'v1', false) $$,
  '42501', null, 'authenticated não chama criar_lead');
reset role;

-- O anon já é testado em 010_privilegios.
select results_eq('select count(*)::int from public.leads', array[2], 'nenhum lead inválido foi gravado');

select * from finish();
rollback;
