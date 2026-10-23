import { carregar, dadosProdutoSchema } from "@/conteudo/esquemas";
import * as agendaCobranca from "./agenda-cobranca.mdx";

// Produtos da AplicarOn. Para adicionar: crie o .mdx nesta pasta e acrescente uma linha abaixo.
// A chave é o slug da URL (/produtos/<slug>).
export const produtos = [carregar(dadosProdutoSchema, "agenda-cobranca", agendaCobranca)].sort(
  (a, b) => a.dados.ordem - b.dados.ordem,
);

export function buscarProduto(slug: string) {
  return produtos.find((p) => p.slug === slug);
}
