-- Separa os eventos do Asaas por ambiente (sandbox × produção).
-- O corpo do evento não diz de qual ambiente ele veio: a rota descobre pelo token que bateu
-- (ASAAS_WEBHOOK_TOKEN = produção, ASAAS_WEBHOOK_TOKEN_SANDBOX = sandbox) e grava aqui.
-- A Fase 1 (fatura, suspensão) só age em eventos de produção.

-- As linhas que já existem são todas de teste no sandbox (21/10/2026): o default as marca
-- e depois sai, para que toda gravação nova tenha que dizer o ambiente.
alter table public.asaas_eventos
  add column ambiente text not null default 'sandbox'
    constraint asaas_eventos_ambiente_valido check (ambiente in ('sandbox', 'producao'));
alter table public.asaas_eventos alter column ambiente drop default;

-- O id do Asaas é um prefixo fixo por tipo de evento + um número sequencial: sandbox e produção
-- podem gerar o mesmo id. Único por ambiente, senão um evento real seria descartado como repetido.
alter table public.asaas_eventos drop constraint asaas_eventos_evento_id_key;
alter table public.asaas_eventos
  add constraint asaas_eventos_ambiente_evento_id_key unique (ambiente, evento_id);

-- ---------------------------------------------------------------------------
-- registrar_evento_asaas ganha o ambiente
-- ---------------------------------------------------------------------------
drop function sistema.registrar_evento_asaas(text, text, text);

-- Devolve true se gravou e false se o evento já existia naquele ambiente (reenvio do Asaas).
create function sistema.registrar_evento_asaas(
  p_ambiente    text,
  p_evento_id   text,
  p_tipo        text,
  p_cobranca_id text
)
returns boolean
language plpgsql
volatile
security definer
set search_path = ''
as $$
begin
  insert into public.asaas_eventos (ambiente, evento_id, tipo, cobranca_id)
  values (p_ambiente, p_evento_id, p_tipo, p_cobranca_id)
  on conflict (ambiente, evento_id) do nothing;
  return found;
end;
$$;

revoke all on function sistema.registrar_evento_asaas(text, text, text, text) from public, anon, authenticated;
grant execute on function sistema.registrar_evento_asaas(text, text, text, text) to service_role;
