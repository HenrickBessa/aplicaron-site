-- Acesso: helper de autorização, grants e políticas RLS.
-- São duas camadas, e as duas precisam permitir:
--   GRANT -> QUAIS operações e colunas o role pode usar.
--   RLS   -> QUAIS linhas ele enxerga ou altera.

-- ---------------------------------------------------------------------------
-- privado.admin_mfa(): "quem está chamando é admin E entrou com MFA?"
-- ---------------------------------------------------------------------------
-- SECURITY DEFINER porque authenticated não pode ler public.admins.
-- STABLE + chamada nas políticas como (select privado.admin_mfa()) faz o Postgres
-- avaliar uma vez por consulta, e não uma vez por linha.
-- aal2 é o nível de garantia do Supabase Auth depois do segundo fator (TOTP).
create function privado.admin_mfa()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(auth.jwt() ->> 'aal', '') = 'aal2'
     and exists (
       select 1
         from public.admins a
        where a.user_id = auth.uid()
     );
$$;

revoke all on function privado.admin_mfa() from public, anon, service_role;
grant execute on function privado.admin_mfa() to authenticated;

-- ---------------------------------------------------------------------------
-- Grants (anon: nenhum; service_role: nenhum em tabela; DELETE: ninguém)
-- ---------------------------------------------------------------------------
grant select on public.leads, public.lead_notas, public.lead_status_historico to authenticated;

-- Só a coluna status. Tentar alterar nome, email etc. dá "permission denied" antes do RLS.
grant update (status) on public.leads to authenticated;

-- Só lead_id e texto. autor_id vem do default auth.uid() e não pode ser forjado.
grant insert (lead_id, texto) on public.lead_notas to authenticated;

-- ---------------------------------------------------------------------------
-- Políticas RLS (todas restritas a admin com MFA)
-- ---------------------------------------------------------------------------
create policy leads_select_admin
  on public.leads for select to authenticated
  using ((select privado.admin_mfa()));

-- USING filtra quais linhas podem ser alteradas; WITH CHECK valida a linha resultante.
create policy leads_update_admin
  on public.leads for update to authenticated
  using ((select privado.admin_mfa()))
  with check ((select privado.admin_mfa()));

create policy lead_notas_select_admin
  on public.lead_notas for select to authenticated
  using ((select privado.admin_mfa()));

-- A checagem de autor_id é defesa extra: hoje ele nem pode ser enviado (sem grant na coluna).
create policy lead_notas_insert_admin
  on public.lead_notas for insert to authenticated
  with check ((select privado.admin_mfa()) and autor_id = (select auth.uid()));

create policy lead_status_historico_select_admin
  on public.lead_status_historico for select to authenticated
  using ((select privado.admin_mfa()));

-- public.admins: RLS ligada, nenhuma política, nenhum grant.
