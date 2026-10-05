import type { MDXContent } from "mdx/types";
import { z } from "zod";
import { servicoSchema } from "@/lib/validacao/enums";

// Formato dos `dados` exportados por cada MDX. Validados no build: um campo faltando
// ou com tipo errado quebra o `next build`, em vez de virar uma página com "undefined".

const base = {
  titulo: z.string().min(3).max(80),
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
});

export const dadosCaseSchema = z.object({
  ...base,
  cliente: z.string().min(2),
  setor: z.string().min(2),
  servico: servicoSchema.exclude(["outro"]),
  resultado: z.string().min(10).max(120),
});

export const dadosPoliticaSchema = z.object({
  versao: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "use a data de vigência, AAAA-MM-DD"),
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
