-- Tabelas. RLS ligada em todas; nenhum grant aqui (grants e políticas ficam em _acesso.sql).

-- ---------------------------------------------------------------------------
-- leads
-- ---------------------------------------------------------------------------
create table public.leads (
  id uuid primary key default gen_random_uuid(),
  -- Gerado no navegador ao abrir o formulário. UNIQUE garante que reenvios
  -- (duplo clique, recarregar, rede instável) não criem leads duplicados.
  submission_id uuid not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  nome text not null
    constraint leads_nome_tamanho check (char_length(nome) between 2 and 120),
  -- Nulo só depois da anonimização (ver leads_email_ou_anonimizado).
  email text
    constraint leads_email_formato check (
      char_length(email) <= 254
      and email = lower(email)
      and email ~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'
    ),
  whatsapp text
    constraint leads_whatsapp_e164 check (whatsapp ~ '^\+[1-9][0-9]{7,14}$'),
  empresa text
    constraint leads_empresa_tamanho check (char_length(empresa) <= 120),

  servico public.servico_tipo not null,
  faixa_orcamento public.orcamento_faixa not null,
  descricao text not null
    constraint leads_descricao_tamanho check (char_length(descricao) between 10 and 2000),

  -- CRM (Fase 2). versao permite concorrência otimista: UPDATE ... WHERE versao = N.
  status public.lead_status not null default 'novo',
  versao integer not null default 1,
  ultima_atividade_em timestamptz not null default now(),

  pagina_origem text constraint leads_pagina_origem_tamanho check (char_length(pagina_origem) <= 200),
  utm_source    text constraint leads_utm_source_tamanho    check (char_length(utm_source) <= 200),
  utm_medium    text constraint leads_utm_medium_tamanho    check (char_length(utm_medium) <= 200),
  utm_campaign  text constraint leads_utm_campaign_tamanho  check (char_length(utm_campaign) <= 200),

  -- LGPD: qual versão da política o visitante viu, e consentimento opcional de marketing.
  politica_versao text not null,
  marketing_optin boolean not null default false,
  marketing_optin_em timestamptz,
  marketing_revogado_em timestamptz,

  -- Fila de notificação por e-mail (ver sistema.reivindicar_notificacoes).
  notificacao_status public.notificacao_estado not null default 'pendente',
  notificacao_tentativas smallint not null default 0,
  notificacao_proxima_em timestamptz default now(),
  notificacao_travada_ate timestamptz,

  anonimizado_em timestamptz,

  constraint leads_email_ou_anonimizado check (anonimizado_em is not null or email is not null),
  constraint leads_optin_com_data check (marketing_optin = false or marketing_optin_em is not null)
);

-- Acelera a busca da fila de notificação (só linhas ainda não enviadas).
create index leads_fila_notificacao_idx
  on public.leads (notificacao_proxima_em)
  where notificacao_status <> 'enviada';

-- ---------------------------------------------------------------------------
-- lead_notas
-- ---------------------------------------------------------------------------
create table public.lead_notas (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads (id) on delete cascade,
  autor_id uuid default auth.uid() references auth.users (id) on delete set null,
  texto text not null
    constraint lead_notas_texto_tamanho check (char_length(texto) between 1 and 5000),
  created_at timestamptz not null default now()
);

create index lead_notas_lead_id_idx on public.lead_notas (lead_id);

-- ---------------------------------------------------------------------------
-- lead_status_historico (só o trigger escreve aqui)
-- ---------------------------------------------------------------------------
create table public.lead_status_historico (
  id bigint generated always as identity primary key,
  lead_id uuid not null references public.leads (id) on delete cascade,
  status_anterior public.lead_status not null,
  status_novo public.lead_status not null,
  alterado_por uuid references auth.users (id) on delete set null,
  alterado_em timestamptz not null default now()
);

create index lead_status_historico_lead_id_idx on public.lead_status_historico (lead_id);

-- ---------------------------------------------------------------------------
-- admins (sem políticas: só o postgres, via SQL manual, insere aqui)
-- ---------------------------------------------------------------------------
create table public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- RLS e revogação explícita
-- ---------------------------------------------------------------------------
-- Com RLS ligada e sem política, a tabela não devolve nenhuma linha para quem não é dono.
alter table public.leads                 enable row level security;
alter table public.lead_notas            enable row level security;
alter table public.lead_status_historico enable row level security;
alter table public.admins                enable row level security;

-- Os privilégios padrão já foram revogados em _fundacao.sql; repetimos aqui por garantia,
-- caso o banco de destino tenha privilégios padrão diferentes.
revoke all on public.leads, public.lead_notas, public.lead_status_historico, public.admins
  from anon, authenticated, service_role, public;
revoke all on sequence public.lead_status_historico_id_seq
  from anon, authenticated, service_role, public;
