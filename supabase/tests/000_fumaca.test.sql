-- Teste de fumaça: garante que o pgTAP roda no banco local e no CI.
-- Os testes reais de RLS, grants e funções entram na fatia 1.
begin;
select plan(1);

select ok(true, 'pgTAP está funcionando');

select * from finish();
rollback;
