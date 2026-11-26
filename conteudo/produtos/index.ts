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

// Selo da situação: /produtos e a lista de interesse só mostram quem não está disponível; /henrick mostra todos.
export const ROTULO_SITUACAO = { disponivel: "Disponível", em_piloto: "Em piloto", em_desenvolvimento: "Em desenvolvimento" } as const;

export function buscarProduto(slug: string) {
  return produtos.find((p) => p.slug === slug);
}
