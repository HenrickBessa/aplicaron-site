-- CRM (Fase 2): busca da lista de leads do /admin por nome, e-mail ou empresa.
--
-- Por que uma função: no supabase-js, juntar filtros com OU só dá pelo .or(), que recebe um
-- TEXTO interpretado pelo PostgREST; com o valor digitado dentro, a busca poderia injetar
-- condições no filtro. Aqui o texto digitado é só um parâmetro. Os outros filtros (status,
-- serviço, plano), a ordem e a paginação continuam no supabase-js, encadeados sobre o resultado.
--
-- SECURITY INVOKER (o padrão, explícito): roda com os privilégios de quem chama, então o RLS de
-- leads vale como num SELECT direto (só admin com MFA vê linhas).
-- % e _ digitados são procurados como texto, não como curinga do ILIKE.
create function public.listar_leads(p_busca text default null)
returns setof public.leads
language sql
stable
security invoker
set search_path = ''
as $$
  select l.*
    from public.leads l,
         (select '%' || replace(replace(replace(p_busca, '\', '\\'), '%', '\%'), '_', '\_') || '%' as padrao) b
   where p_busca is null
      or l.nome    ilike b.padrao escape '\'
      or l.email   ilike b.padrao escape '\'
      or l.empresa ilike b.padrao escape '\';
$$;

revoke all on function public.listar_leads(text) from public, anon, service_role;
grant execute on function public.listar_leads(text) to authenticated;
