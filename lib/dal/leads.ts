import "server-only";
import { z } from "@/lib/validacao/zod";
import type { Addon, FaixaOrcamento, Plano, Servico, StatusLead } from "@/lib/validacao/enums";
import { exigirAdmin } from "./admin";

// Dados do CRM. Toda função começa com exigirAdmin(); quem decide quais linhas aparecem é o
// RLS (admin + MFA). Nada aqui é cacheado entre requisições: as páginas do admin são dinâmicas.

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
