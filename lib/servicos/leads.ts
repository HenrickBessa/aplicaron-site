import "server-only";
import { clienteSistema } from "@/lib/supabase/sistema";
import type { Diagnostico } from "@/lib/validacao/diagnostico";
import type { Addon, Plano } from "@/lib/validacao/enums";

const TIMEOUT_MS = 8_000;

export type ResultadoCriarLead = { criado: boolean; leadId: string };

// Diagnóstico (com faixa) ou interesse em plano (com plano, sem faixa). O banco exige um dos dois.
type DadosLead = Omit<Diagnostico, "faixa_orcamento" | "plano_interesse"> & {
  faixa_orcamento?: Diagnostico["faixa_orcamento"];
  plano_interesse?: Plano;
  addons?: Addon[];
  cidade?: string;
  segmento?: string;
  politica_versao: string;
};

// Grava o lead pela função sistema.criar_lead (idempotente pelo submission_id).
// Recebe dados JÁ validados e normalizados pela Action. Não conhece cookies nem request.
// Lança erro em falha ou timeout; quem chama decide o que mostrar ao visitante.
export async function criarLead(dados: DadosLead): Promise<ResultadoCriarLead> {
  const { data, error } = await clienteSistema()
    .schema("sistema")
    .rpc("criar_lead", {
      p_submission_id: dados.submission_id,
      p_nome: dados.nome,
      p_email: dados.email,
      p_whatsapp: dados.whatsapp ?? null,
      p_empresa: dados.empresa ?? null,
      p_servico: dados.servico,
      p_faixa_orcamento: dados.faixa_orcamento ?? null,
      p_descricao: dados.descricao,
      p_politica_versao: dados.politica_versao,
      p_marketing_optin: dados.marketing_optin,
      p_pagina_origem: dados.pagina_origem ?? null,
      p_utm_source: dados.utm_source ?? null,
      p_utm_medium: dados.utm_medium ?? null,
      p_utm_campaign: dados.utm_campaign ?? null,
      p_plano_interesse: dados.plano_interesse ?? null,
      p_addons: dados.addons ?? [],
      p_cidade: dados.cidade ?? null,
      p_segmento: dados.segmento ?? null,
    })
    .abortSignal(AbortSignal.timeout(TIMEOUT_MS));

  if (error) {
    // Só o código vai para a mensagem; nunca os dados do lead.
    throw new Error(`criar_lead falhou: ${error.code ?? "sem_codigo"}`);
  }

  const linha = (data as { id: string; criado: boolean }[] | null)?.[0];
  if (!linha) throw new Error("criar_lead não devolveu linha");
  return { criado: linha.criado, leadId: linha.id };
}
