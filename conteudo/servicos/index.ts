import { carregar, dadosServicoSchema } from "@/conteudo/esquemas";
import * as aplicativos from "./aplicativos.mdx";
import * as automacaoIa from "./automacao-ia.mdx";
import * as sistemas from "./sistemas.mdx";
import * as sites from "./sites.mdx";

// Para adicionar um serviço: crie o .mdx nesta pasta e acrescente uma linha abaixo.
// A chave é o slug da URL (/servicos/<slug>).
export const servicos = [
  carregar(dadosServicoSchema, "automacao-ia", automacaoIa),
  carregar(dadosServicoSchema, "sites", sites),
  carregar(dadosServicoSchema, "sistemas", sistemas),
  carregar(dadosServicoSchema, "aplicativos", aplicativos),
].sort((a, b) => a.dados.ordem - b.dados.ordem);

export function buscarServico(slug: string) {
  return servicos.find((s) => s.slug === slug);
}
