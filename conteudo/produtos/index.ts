import { carregar, dadosProdutoSchema } from "@/conteudo/esquemas";
import * as agendaCobranca from "./agenda-cobranca.mdx";
import * as aplicaragro from "./aplicaragro.mdx";
import * as aplicarsaude from "./aplicarsaude.mdx";

// Produtos da AplicarOn. Para adicionar: crie o .mdx nesta pasta e acrescente uma linha abaixo.
// A chave é o slug da URL (/produtos/<slug>).
export const produtos = [
  carregar(dadosProdutoSchema, "agenda-cobranca", agendaCobranca),
  carregar(dadosProdutoSchema, "aplicaragro", aplicaragro),
  carregar(dadosProdutoSchema, "aplicarsaude", aplicarsaude),
].sort((a, b) => a.dados.ordem - b.dados.ordem);

// Selo de quem ainda não está disponível (cartão em /produtos e lista de interesse).
export const ROTULO_SITUACAO = { em_piloto: "Em piloto", em_desenvolvimento: "Em desenvolvimento" } as const;

export function buscarProduto(slug: string) {
  return produtos.find((p) => p.slug === slug);
}
