import { carregar, dadosCaseSchema } from "@/conteudo/esquemas";
import * as clinica from "./clinica-atendimento-ia.mdx";
import * as distribuidora from "./distribuidora-sistema-pedidos.mdx";

// Para adicionar um case: crie o .mdx nesta pasta e acrescente uma linha abaixo.
export const cases = [
  carregar(dadosCaseSchema, "clinica-atendimento-ia", clinica),
  carregar(dadosCaseSchema, "distribuidora-sistema-pedidos", distribuidora),
].sort((a, b) => a.dados.ordem - b.dados.ordem);

export function buscarCase(slug: string) {
  return cases.find((c) => c.slug === slug);
}
