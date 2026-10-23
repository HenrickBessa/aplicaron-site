-- Leads vindos da página /planos (23/10/2026): plano escolhido, add-ons, cidade e segmento.
-- O CRM (Fase 2) usa plano_interesse e addons para classificar o lead.
-- Lead de plano não tem faixa de orçamento (o preço já está na página); lead de diagnóstico continua tendo.

-- Espelho em lib/validacao/enums.ts (PLANOS, ADDONS). Mudou aqui, mude lá.
create type public.plano_tipo as enum ('presenca', 'vende', 'agenda_cobranca');
create type public.addon_tipo as enum ('crm', 'cobranca_whatsapp', 'manutencao_4h');

alter table public.leads
  add column plano_interesse public.plano_tipo,
  add column addons public.addon_tipo[] not null default '{}'
    constraint leads_addons_tamanho check (cardinality(addons) <= 3),
  add column cidade text
    constraint leads_cidade_tamanho check (char_length(cidade) <= 80),
  add column segmento text
    constraint leads_segmento_tamanho check (char_length(segmento) <= 80),
  alter column faixa_orcamento drop not null,
  add constraint leads_faixa_ou_plano check (faixa_orcamento is not null or plano_interesse is not null);

-- ---------------------------------------------------------------------------
-- criar_lead ganha os campos novos (todos opcionais, no fim)
-- ---------------------------------------------------------------------------
drop function sistema.criar_lead(uuid, text, text, text, text, public.servico_tipo, public.orcamento_faixa, text, text, boolean, text, text, text, text);

create function sistema.criar_lead(
  p_submission_id   uuid,
  p_nome            text,
  p_email           text,
  p_whatsapp        text,
  p_empresa         text,
  p_servico         public.servico_tipo,
  p_faixa_orcamento public.orcamento_faixa,
  p_descricao       text,
  p_politica_versao text,
  p_marketing_optin boolean,
  p_pagina_origem   text default null,
  p_utm_source      text default null,
  p_utm_medium      text default null,
  p_utm_campaign    text default null,
  p_plano_interesse public.plano_tipo default null,
  p_addons          public.addon_tipo[] default '{}',
  p_cidade          text default null,
  p_segmento        text default null
)
returns table (id uuid, criado boolean)
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_id uuid;
  v_optin boolean := coalesce(p_marketing_optin, false);
begin
  insert into public.leads as l (
    submission_id, nome, email, whatsapp, empresa, servico, faixa_orcamento, descricao,
    politica_versao, marketing_optin, marketing_optin_em,
    pagina_origem, utm_source, utm_medium, utm_campaign,
    plano_interesse, addons, cidade, segmento
  )
  values (
    p_submission_id, p_nome, p_email, p_whatsapp, p_empresa, p_servico, p_faixa_orcamento, p_descricao,
    p_politica_versao, v_optin, case when v_optin then now() end,
    p_pagina_origem, p_utm_source, p_utm_medium, p_utm_campaign,
    -- Sem repetição: marcar o mesmo add-on duas vezes vira um só.
    p_plano_interesse, array(select distinct unnest(coalesce(p_addons, '{}')) order by 1), p_cidade, p_segmento
  )
  on conflict (submission_id) do nothing
  returning l.id into v_id;

  if v_id is not null then
    return query select v_id, true;
  else
    return query
      select l.id, false
        from public.leads l
       where l.submission_id = p_submission_id;
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- reivindicar_notificacoes devolve também o plano (assunto do e-mail)
-- ---------------------------------------------------------------------------
drop function sistema.reivindicar_notificacoes(integer, uuid);

create function sistema.reivindicar_notificacoes(p_limite integer, p_lead_id uuid default null)
returns table (
  id uuid,
  tentativa smallint,
  servico public.servico_tipo,
  faixa_orcamento public.orcamento_faixa,
  plano_interesse public.plano_tipo
)
language sql
volatile
security definer
set search_path = ''
as $$
  with alvo as materialized (
    select c.id
      from public.leads c
     where c.notificacao_status <> 'enviada'
       and c.notificacao_proxima_em <= now()
       and (c.notificacao_travada_ate is null or c.notificacao_travada_ate <= now())
       and c.notificacao_tentativas < 5
       and (p_lead_id is null or c.id = p_lead_id)
     order by c.notificacao_proxima_em
     limit least(greatest(coalesce(p_limite, 0), 0), 100)
       for update skip locked
  )
  update public.leads l
     set notificacao_tentativas  = l.notificacao_tentativas + 1,
         notificacao_travada_ate = now() + interval '2 minutes'
    from alvo
   where l.id = alvo.id
  returning l.id, l.notificacao_tentativas, l.servico, l.faixa_orcamento, l.plano_interesse;
$$;

-- ---------------------------------------------------------------------------
-- anonimizar_vencidos: cidade também sai (junto com empresa, identifica o negócio)
-- ---------------------------------------------------------------------------
create or replace function sistema.anonimizar_vencidos()
returns integer
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_total integer;
begin
  with alvo as materialized (
    select c.id
      from public.leads c
     where c.anonimizado_em is null
       and c.status <> 'fechado'
       and c.ultima_atividade_em < now() - interval '12 months'
       for update
  ),
  notas_apagadas as (
    delete from public.lead_notas n
     using alvo
     where n.lead_id = alvo.id
  )
  update public.leads l
     set nome           = '[removido]',
         email          = null,
         whatsapp       = null,
         empresa        = null,
         cidade         = null,
         descricao      = '[removido]',
         created_at     = date_trunc('month', l.created_at),
         utm_campaign   = null,
         anonimizado_em = now()
    from alvo
   where l.id = alvo.id;

  get diagnostics v_total = row_count;
  return v_total;
end;
$$;

revoke all on function sistema.criar_lead(uuid, text, text, text, text, public.servico_tipo, public.orcamento_faixa, text, text, boolean, text, text, text, text, public.plano_tipo, public.addon_tipo[], text, text) from public, anon, authenticated;
grant execute on function sistema.criar_lead(uuid, text, text, text, text, public.servico_tipo, public.orcamento_faixa, text, text, boolean, text, text, text, text, public.plano_tipo, public.addon_tipo[], text, text) to service_role;
revoke all on function sistema.reivindicar_notificacoes(integer, uuid) from public, anon, authenticated;
grant execute on function sistema.reivindicar_notificacoes(integer, uuid) to service_role;
