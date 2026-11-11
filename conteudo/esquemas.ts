import type { MDXContent } from "mdx/types";
import * as z from "@/lib/validacao/zod";
import { planoSchema, servicoSchema } from "@/lib/validacao/enums";

// Formato dos `dados` exportados por cada MDX. Validados no build: um campo faltando
// ou com tipo errado quebra o `next build`, em vez de virar uma página com "undefined".

const base = {
  titulo: z.string().min(3).max(80),
  // <title> quando o h1 não é o que o cliente digita no Google. 48 + " · AplicarOn" = 60, sem corte no Google.
  tituloSeo: z.string().min(10).max(48).optional(),
  // Vira a meta description: até ~160 caracteres para não ser cortada no Google.
  descricao: z.string().min(50).max(160),
  ordem: z.number().int(),
  // true enquanto o texto for provisório. A página mostra o selo RASCUNHO.
  rascunho: z.boolean(),
};

export const dadosPaginaSchema = z.object(base);

export const dadosServicoSchema = z.object({
  ...base,
  servico: servicoSchema.exclude(["outro"]),
  resumo: z.string().min(20).max(200),
  // Três destaques curtos exibidos no cartão do serviço na home.
  destaques: z.array(z.string().min(5).max(60)).length(3),
});

export const dadosClienteSchema = z.object({
  ...base,
  cliente: z.string().min(2),
  setor: z.string().min(2),
  cidade: z.string().min(2),
  // O que a AplicarOn entregou para este cliente (um ou mais serviços).
  servicos: z.array(servicoSchema.exclude(["outro"])).min(1),
  // Site do cliente (link externo na página do case).
  site: z.url(),
  // Frase curta do cartão na home e na lista de clientes.
  resumo: z.string().min(20).max(200),
  // O que mudou na operação do cliente, na nossa voz. Aparece no topo do case.
  resultado: z.string().min(40).max(280),
  // A mesma ideia na voz do cliente. Só vai ao ar com status "aprovado", depois do ok do cliente.
  depoimento: z.object({ texto: z.string().min(20).max(200), status: z.enum(["rascunho", "aprovado"]) }).optional(),
});

export const dadosProdutoSchema = z.object({
  ...base,
  // Nome curto (trilha, cartões, menu). O `titulo` é a chamada principal, que vira o h1.
  nome: z.string().min(2).max(40),
  // Obrigatório aqui: o h1 do produto é a chamada de venda.
  tituloSeo: z.string().min(10).max(48),
  resumo: z.string().min(20).max(200),
  // Plano de /planos vendido nesta página (preço e formulário vêm de conteudo/planos.ts).
  plano: planoSchema.optional(),
  // em_piloto (já em uso, ainda fechado) e em_desenvolvimento: sem preço, com lista de interesse.
  situacao: z.enum(["disponivel", "em_piloto", "em_desenvolvimento"]),
});

export const dadosPoliticaSchema = z.object({
  // Data de vigência; mais de uma versão no mesmo dia ganha sufixo: 2026-10-06-2.
  versao: z.string().regex(/^\d{4}-\d{2}-\d{2}(-\d+)?$/, "use a data de vigência, AAAA-MM-DD (ou AAAA-MM-DD-N)"),
  rascunho: z.boolean(),
});

export type ModuloMdx = { default: MDXContent; dados: unknown };

// Valida um MDX importado e devolve os dados tipados junto com o componente.
export function carregar<T extends z.ZodType>(esquema: T, slug: string, modulo: ModuloMdx) {
  const resultado = esquema.safeParse(modulo.dados);
  if (!resultado.success) {
    throw new Error(`Dados inválidos em "${slug}.mdx": ${z.prettifyError(resultado.error)}`);
  }
  return { slug, dados: resultado.data as z.infer<T>, Conteudo: modulo.default };
}
