-- Triggers. As funções ficam em `privado` (fora da Data API).
-- Todas com search_path vazio e nomes qualificados, para que um objeto homônimo
-- criado em outro schema não seja chamado no lugar do original.

-- ---------------------------------------------------------------------------
-- updated_at em todo UPDATE de leads
-- ---------------------------------------------------------------------------
create function privado.definir_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger leads_definir_updated_at
  before update on public.leads
  for each row execute function privado.definir_updated_at();

-- ---------------------------------------------------------------------------
-- Mudança de status: incrementa versao e marca atividade
-- ---------------------------------------------------------------------------
-- Roda ANTES do UPDATE e altera a própria linha. Não precisa de SECURITY DEFINER:
-- o privilégio de coluna é checado só nas colunas do SET, não no que o trigger muda.
create function privado.incrementar_versao_status()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.versao := old.versao + 1;
  new.ultima_atividade_em := now();
  return new;
end;
$$;

create trigger leads_incrementar_versao_status
  before update of status on public.leads
  for each row execute function privado.incrementar_versao_status();

-- ---------------------------------------------------------------------------
-- Mudança de status: grava histórico
-- ---------------------------------------------------------------------------
-- SECURITY DEFINER porque o admin não tem INSERT em lead_status_historico: o histórico
-- só pode ser escrito por este trigger, nunca diretamente.
create function privado.registrar_historico_status()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.lead_status_historico (lead_id, status_anterior, status_novo, alterado_por)
  values (new.id, old.status, new.status, auth.uid());
  return null;
end;
$$;

create trigger leads_registrar_historico_status
  after update of status on public.leads
  for each row
  when (old.status is distinct from new.status)
  execute function privado.registrar_historico_status();

-- ---------------------------------------------------------------------------
-- Nova nota: marca atividade no lead
-- ---------------------------------------------------------------------------
-- SECURITY DEFINER porque o admin só tem UPDATE na coluna status de leads.
create function privado.marcar_atividade_lead()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.leads
     set ultima_atividade_em = now()
   where id = new.lead_id;
  return null;
end;
$$;

create trigger lead_notas_marcar_atividade_lead
  after insert on public.lead_notas
  for each row execute function privado.marcar_atividade_lead();

-- Ninguém chama funções de trigger diretamente.
revoke all on all functions in schema privado from public, anon, authenticated, service_role;
