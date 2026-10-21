-- Eventos do webhook do Asaas (cobrança das mensalidades da AplicarOn).
-- Por enquanto só guarda o que chegou: o processamento (faturas, suspensão) vem na Fase 1.
-- Sem nome, CPF ou corpo inteiro do evento: só os ids e o tipo (LGPD).

create table public.asaas_eventos (
  id uuid primary key default gen_random_uuid(),
  -- id do evento no Asaas (evt_...). UNIQUE: o Asaas entrega "pelo menos uma vez",
  -- então o mesmo evento pode chegar repetido e não pode virar duas linhas.
  evento_id text not null unique
    constraint asaas_eventos_evento_id_tamanho check (char_length(evento_id) between 1 and 200),
  tipo text not null
    constraint asaas_eventos_tipo_formato check (tipo ~ '^[A-Z_]{1,80}$'),
  -- id da cobrança no Asaas (pay_...).
  cobranca_id text not null
    constraint asaas_eventos_cobranca_id_tamanho check (char_length(cobranca_id) between 1 and 100),
  recebido_em timestamptz not null default now()
);

create index asaas_eventos_cobranca_id_idx on public.asaas_eventos (cobranca_id);

alter table public.asaas_eventos enable row level security;

-- Leitura só para o admin com MFA (tela futura do /admin). Nenhum outro grant.
grant select on public.asaas_eventos to authenticated;

create policy asaas_eventos_select_admin
  on public.asaas_eventos for select to authenticated
  using ((select privado.admin_mfa()));

-- ---------------------------------------------------------------------------
-- registrar_evento_asaas: grava de forma idempotente pelo evento_id
-- ---------------------------------------------------------------------------
-- Devolve true se gravou e false se o evento já existia (reenvio do Asaas).
create function sistema.registrar_evento_asaas(
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
  insert into public.asaas_eventos (evento_id, tipo, cobranca_id)
  values (p_evento_id, p_tipo, p_cobranca_id)
  on conflict (evento_id) do nothing;
  return found;
end;
$$;

revoke all on function sistema.registrar_evento_asaas(text, text, text) from public, anon, authenticated;
grant execute on function sistema.registrar_evento_asaas(text, text, text) to service_role;
