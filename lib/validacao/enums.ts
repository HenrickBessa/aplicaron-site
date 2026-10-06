import { z } from "./zod";

// Espelho dos enums do banco (supabase/migrations/*_fundacao.sql).
// Se mudar aqui, mude lá também (e vice-versa).

export const SERVICOS = ["automacao_ia", "sites", "sistemas", "aplicativos", "outro"] as const;
export const servicoSchema = z.enum(SERVICOS);
export type Servico = z.infer<typeof servicoSchema>;

export const ROTULOS_SERVICO: Record<Servico, string> = {
  automacao_ia: "Automação com IA",
  sites: "Sites",
  sistemas: "Sistemas",
  aplicativos: "Aplicativos",
  outro: "Outro",
};

export const FAIXAS_ORCAMENTO = ["ate_5k", "5k_15k", "15k_50k", "acima_50k", "nao_sei"] as const;
export const faixaOrcamentoSchema = z.enum(FAIXAS_ORCAMENTO);
export type FaixaOrcamento = z.infer<typeof faixaOrcamentoSchema>;

export const ROTULOS_FAIXA: Record<FaixaOrcamento, string> = {
  ate_5k: "Até R$ 5 mil",
  "5k_15k": "R$ 5 mil a R$ 15 mil",
  "15k_50k": "R$ 15 mil a R$ 50 mil",
  acima_50k: "Acima de R$ 50 mil",
  nao_sei: "Ainda não sei",
};
