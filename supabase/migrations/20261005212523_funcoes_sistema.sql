-- Funções do schema `sistema`: a única porta de escrita do servidor no banco.
-- O servidor usa a chave secret (role service_role), que NÃO tem grant em nenhuma tabela.
-- Por isso todas são SECURITY DEFINER: executam como o dono (postgres) e fazem só o que está escrito aqui.

-- ---------------------------------------------------------------------------
-- criar_lead: insere de forma idempotente pelo submission_id
-- ---------------------------------------------------------------------------
-- Se o mesmo submission_id chegar de novo (reenvio), não cria outro lead:
-- devolve o id existente com criado = false, e o servidor não dispara outra notificação.
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
  p_utm_campaign    text default null
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
    pagina_origem, utm_source, utm_medium, utm_campaign
  )
  values (
    p_submission_id, p_nome, p_email, p_whatsapp, p_empresa, p_servico, p_faixa_orcamento, p_descricao,
    p_politica_versao, v_optin, case when v_optin then now() end,
    p_pagina_origem, p_utm_source, p_utm_medium, p_utm_campaign
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
-- reivindicar_notificacoes: pega um lote da fila sem colidir com outro worker
-- ---------------------------------------------------------------------------
-- FOR UPDATE SKIP LOCKED: se dois processos (o after() do formulário e o cron) rodarem
-- ao mesmo tempo, cada um trava linhas diferentes e pula as já travadas.
-- A "trava" de 2 minutos (travada_ate) cobre o envio do e-mail fora da transação:
-- se o processo morrer no meio, a linha volta para a fila quando a trava vence.
-- tentativas é incrementado AQUI, e o valor devolvido identifica esta tentativa
-- em concluir_notificacao.
create function sistema.reivindicar_notificacoes(p_limite integer, p_lead_id uuid default null)
returns table (
  id uuid,
  tentativa smallint,
  servico public.servico_tipo,
  faixa_orcamento public.orcamento_faixa
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
  returning l.id, l.notificacao_tentativas, l.servico, l.faixa_orcamento;
$$;

-- ---------------------------------------------------------------------------
-- concluir_notificacao: registra o resultado de UMA tentativa
-- ---------------------------------------------------------------------------
-- Só grava se p_tentativa ainda for a tentativa atual. Se a trava venceu e outro worker
-- reivindicou a linha (tentativas mudou), este resultado atrasado é descartado.
-- Backoff após falha na tentativa N: 5min, 15min, 1h, 6h, 24h. Com o limite de 5
-- tentativas, após a 5ª falha não há próxima.
-- p_codigo (ex.: código de erro do Resend) vai só para o log do Postgres; não é dado pessoal.
create function sistema.concluir_notificacao(
  p_id        uuid,
  p_tentativa integer,
  p_ok        boolean,
  p_codigo    text default null
)
returns boolean
language plpgsql
volatile
security definer
set search_path = ''
as $$
begin
  update public.leads l
     set notificacao_status = case
           when p_ok then 'enviada'::public.notificacao_estado
           else 'falhou'::public.notificacao_estado
         end,
         notificacao_travada_ate = null,
         notificacao_proxima_em = case
           when p_ok or l.notificacao_tentativas >= 5 then null
           else now() + (array['5 minutes', '15 minutes', '1 hour', '6 hours', '24 hours']::interval[])
                          [l.notificacao_tentativas]
         end
   where l.id = p_id
     and l.notificacao_tentativas = p_tentativa
     and l.notificacao_status <> 'enviada';

  if not found then
    return false;
  end if;

  if not p_ok then
    raise log 'notificacao_falhou lead_id=% tentativa=% codigo=%', p_id, p_tentativa, p_codigo;
  end if;
  return true;
end;
$$;

-- ---------------------------------------------------------------------------
-- anonimizar_vencidos: retenção LGPD (criada e testada, NÃO agendada no MVP)
-- ---------------------------------------------------------------------------
-- Leads sem atividade há mais de 12 meses e que não viraram cliente (status <> fechado)
-- perdem os dados pessoais. Ficam status, serviço e faixa para estatística.
-- Agendar só no 10º mês de operação (ver docs/decisoes.md).
create function sistema.anonimizar_vencidos()
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

-- ---------------------------------------------------------------------------
-- Grants: só service_role executa funções de `sistema`
-- ---------------------------------------------------------------------------
revoke all on all functions in schema sistema from public, anon, authenticated;
grant execute on all functions in schema sistema to service_role;
