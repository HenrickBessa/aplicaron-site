import "server-only";
import { z } from "@/lib/validacao/zod";
import type { FiltrosLeads } from "@/lib/validacao/admin";
import type { Addon, FaixaOrcamento, Plano, Servico, StatusLead } from "@/lib/validacao/enums";
import { exigirAdmin } from "./admin";

// Dados do CRM. Toda função começa com exigirAdmin(); quem decide quais linhas aparecem é o
// RLS (admin + MFA). Nada aqui é cacheado entre requisições: as páginas do admin são dinâmicas.

export const LEADS_POR_PAGINA = 20;

export type LeadResumo = {
  id: string;
  created_at: string;
  nome: string;
  servico: Servico;
  plano_interesse: Plano | null;
  status: StatusLead;
};

// A busca (nome, e-mail ou empresa) é feita pela função public.listar_leads, com o texto como
// parâmetro (nada de .or() montado com o valor digitado). Status, serviço, plano, ordem e página
// são filtros encadeados sobre o resultado; o RLS vale igual (a função é SECURITY INVOKER).
export async function listarLeads(filtros: FiltrosLeads): Promise<{ leads: LeadResumo[]; total: number }> {
  const supabase = await exigirAdmin();
  let consulta = supabase
    .rpc("listar_leads", { p_busca: filtros.busca ?? null }, { count: "exact" })
    .select("id, created_at, nome, servico, plano_interesse, status");
  if (filtros.status) consulta = consulta.eq("status", filtros.status);
  if (filtros.servico) consulta = consulta.eq("servico", filtros.servico);
  if (filtros.plano) consulta = consulta.eq("plano_interesse", filtros.plano);

  const inicio = (filtros.pagina - 1) * LEADS_POR_PAGINA;
  const { data, count, error } = await consulta
    .order("created_at", { ascending: false })
    .order("id")
    .range(inicio, inicio + LEADS_POR_PAGINA - 1);
  // Página depois da última (URL editada à mão): o PostgREST responde 416; vira lista vazia.
  if (error?.code === "PGRST103") return { leads: [], total: 0 };
  if (error) throw new Error(`listar_leads falhou: ${error.code ?? "sem_codigo"}`);
  return { leads: data as LeadResumo[], total: count ?? 0 };
}

export type NotaLead = { id: string; texto: string; created_at: string };
export type MudancaStatus = { id: number; status_anterior: StatusLead; status_novo: StatusLead; alterado_em: string };

export type LeadDetalhe = {
  id: string;
  created_at: string;
  ultima_atividade_em: string;
  nome: string;
  email: string | null;
  whatsapp: string | null;
  empresa: string | null;
  cidade: string | null;
  segmento: string | null;
  servico: Servico;
  faixa_orcamento: FaixaOrcamento | null;
  plano_interesse: Plano | null;
  addons: Addon[];
  descricao: string;
  status: StatusLead;
  versao: number;
  pagina_origem: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  marketing_optin: boolean;
  anonimizado_em: string | null;
  lead_notas: NotaLead[];
  lead_status_historico: MudancaStatus[];
};

const COLUNAS_DETALHE =
  "id, created_at, ultima_atividade_em, nome, email, whatsapp, empresa, cidade, segmento, servico, " +
  "faixa_orcamento, plano_interesse, addons, descricao, status, versao, pagina_origem, utm_source, " +
  "utm_medium, utm_campaign, marketing_optin, anonimizado_em, " +
  "lead_notas(id, texto, created_at), lead_status_historico(id, status_anterior, status_novo, alterado_em)";

// null = id inválido, inexistente ou invisível para quem chamou (a página responde 404 nos três
// casos, sem dizer qual).
export async function buscarLead(id: string): Promise<LeadDetalhe | null> {
  const supabase = await exigirAdmin();
  if (!z.guid().safeParse(id).success) return null;

  const { data, error } = await supabase
    .from("leads")
    .select(COLUNAS_DETALHE)
    .eq("id", id)
    .order("created_at", { referencedTable: "lead_notas", ascending: false })
    .order("alterado_em", { referencedTable: "lead_status_historico", ascending: false })
    .maybeSingle<LeadDetalhe>();
  if (error) throw new Error(`buscar_lead falhou: ${error.code ?? "sem_codigo"}`);
  return data;
}

// Concorrência otimista: só altera se a versão ainda for a que a tela mostrava (o trigger do banco
// incrementa `versao` e grava o histórico). false = outra aba mudou antes, ou o lead não está visível.
export async function mudarStatusLead(id: string, status: StatusLead, versao: number): Promise<boolean> {
  const supabase = await exigirAdmin();
  const { data, error } = await supabase
    .from("leads")
    .update({ status })
    .eq("id", id)
    .eq("versao", versao)
    .select("id");
  if (error) throw new Error(`mudar_status falhou: ${error.code ?? "sem_codigo"}`);
  return data.length > 0;
}

// Só INSERT (lead_id, texto): o autor vem de auth.uid() no banco. Notas não são editadas nem
// apagadas. false = lead inexistente (23503) ou sem permissão pelo RLS (42501).
export async function adicionarNotaLead(id: string, texto: string): Promise<boolean> {
  const supabase = await exigirAdmin();
  const { error } = await supabase.from("lead_notas").insert({ lead_id: id, texto });
  if (error?.code === "23503" || error?.code === "42501") return false;
  if (error) throw new Error(`adicionar_nota falhou: ${error.code ?? "sem_codigo"}`);
  return true;
}
