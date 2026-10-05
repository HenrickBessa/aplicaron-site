-- Triggers: versao, histórico, updated_at, ultima_atividade_em e concorrência otimista.
-- Dentro de uma transação now() é constante; por isso "envelhecemos" as datas antes de cada ação.
begin;
-- Isola o teste de dados que já existam no banco local (ex.: deixados pelos testes E2E).
-- Tudo volta ao estado anterior no rollback do fim do arquivo.
delete from public.leads;
select plan(13);

insert into auth.users (id, email) values ('00000000-0000-0000-0000-00000000a001', 'admin@teste.local');
insert into public.admins (user_id) values ('00000000-0000-0000-0000-00000000a001');

insert into public.leads (id, submission_id, nome, email, servico, faixa_orcamento, descricao, politica_versao)
values ('00000000-0000-0000-0000-0000000001ee', gen_random_uuid(), 'Ana Souza', 'ana@ex.com',
        'sistemas', '15k_50k', 'Preciso de um sistema interno', 'v1');

update public.leads
   set updated_at = now() - interval '1 day',
       ultima_atividade_em = now() - interval '1 day'
 where id = '00000000-0000-0000-0000-0000000001ee';

-- Ações como admin com MFA, para conferir alterado_por.
set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub":"00000000-0000-0000-0000-00000000a001","role":"authenticated","aal":"aal2"}', true);

-- ---------------------------------------------------------------------------
-- Mudança de status com a versão correta
-- ---------------------------------------------------------------------------
select results_eq(
  $$ update public.leads set status = 'em_contato'
      where id = '00000000-0000-0000-0000-0000000001ee' and versao = 1
  returning versao $$,
  array[2],
  'UPDATE de status com a versão atual incrementa versao para 2'
);

select results_eq(
  $$ select status_anterior::text, status_novo::text, alterado_por
       from public.lead_status_historico where lead_id = '00000000-0000-0000-0000-0000000001ee' $$,
  $$ values ('novo', 'em_contato', '00000000-0000-0000-0000-00000000a001'::uuid) $$,
  'histórico gravado com status anterior, novo e quem alterou'
);

select results_eq(
  $$ select ultima_atividade_em = now(), updated_at = now()
       from public.leads where id = '00000000-0000-0000-0000-0000000001ee' $$,
  $$ values (true, true) $$,
  'mudança de status atualiza ultima_atividade_em e updated_at'
);

-- ---------------------------------------------------------------------------
-- Concorrência otimista: versão desatualizada não altera nada
-- ---------------------------------------------------------------------------
select is_empty(
  $$ update public.leads set status = 'perdido'
      where id = '00000000-0000-0000-0000-0000000001ee' and versao = 1
  returning id $$,
  'UPDATE com versão desatualizada não atinge nenhuma linha'
);

select results_eq(
  $$ select status::text, versao from public.leads where id = '00000000-0000-0000-0000-0000000001ee' $$,
  $$ values ('em_contato', 2) $$,
  'status e versao continuam os mesmos após o UPDATE rejeitado'
);

select results_eq(
  $$ select count(*)::int from public.lead_status_historico where lead_id = '00000000-0000-0000-0000-0000000001ee' $$,
  array[1],
  'UPDATE rejeitado não gera histórico'
);

-- ---------------------------------------------------------------------------
-- Status igual ao atual: sem histórico
-- ---------------------------------------------------------------------------
select lives_ok(
  $$ update public.leads set status = 'em_contato' where id = '00000000-0000-0000-0000-0000000001ee' $$,
  'UPDATE para o mesmo status é aceito'
);

select results_eq(
  $$ select count(*)::int from public.lead_status_historico where lead_id = '00000000-0000-0000-0000-0000000001ee' $$,
  array[1],
  'UPDATE para o mesmo status não gera histórico'
);

-- ---------------------------------------------------------------------------
-- Segunda mudança: novo histórico, versão segue subindo
-- ---------------------------------------------------------------------------
select results_eq(
  $$ update public.leads set status = 'proposta_enviada'
      where id = '00000000-0000-0000-0000-0000000001ee'
  returning versao $$,
  array[4],
  'versao incrementa a cada UPDATE de status (3 UPDATEs aceitos -> versao 4)'
);

select results_eq(
  $$ select count(*)::int from public.lead_status_historico where lead_id = '00000000-0000-0000-0000-0000000001ee' $$,
  array[2],
  'segunda mudança real de status gera o segundo histórico'
);

-- ---------------------------------------------------------------------------
-- Nota nova marca atividade no lead
-- ---------------------------------------------------------------------------
reset role;
update public.leads set ultima_atividade_em = now() - interval '1 day'
 where id = '00000000-0000-0000-0000-0000000001ee';

set local role authenticated;
select lives_ok(
  $$ insert into public.lead_notas (lead_id, texto) values ('00000000-0000-0000-0000-0000000001ee', 'Ligar amanhã') $$,
  'admin insere nota'
);

select results_eq(
  $$ select ultima_atividade_em = now() from public.leads where id = '00000000-0000-0000-0000-0000000001ee' $$,
  array[true],
  'nota nova atualiza ultima_atividade_em do lead'
);

select results_eq(
  $$ select versao from public.leads where id = '00000000-0000-0000-0000-0000000001ee' $$,
  array[4],
  'nota nova não altera versao'
);

reset role;

select * from finish();
rollback;
