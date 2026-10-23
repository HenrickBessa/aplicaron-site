import { z } from "@/lib/validacao/zod";
import { planoSchema, servicoSchema, statusLeadSchema } from "./enums";

// Login do admin. A senha não é validada além do tamanho: quem confere é o Supabase Auth.
export const entrarSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  senha: z.string().min(1).max(200),
});

// Código de 6 dígitos do app autenticador. Espaços são tolerados ("123 456").
export const codigoMfaSchema = z.object({
  codigo: z
    .string()
    .transform((v) => v.replace(/\s/g, ""))
    .pipe(z.string().regex(/^\d{6}$/)),
});

// CRM. O lead_id vem de um campo escondido do formulário: como toda Action é endpoint público,
// ele é validado aqui e, no banco, o RLS decide se o lead pode ser alterado.
// versao: a versão que a tela mostrava. Se outra aba mudou o status antes, o UPDATE não acha a linha.
export const mudarStatusSchema = z.object({
  lead_id: z.guid(),
  status: statusLeadSchema,
  versao: z.coerce.number().int().positive(),
});

// Nota no lead: mesmo limite do banco (lead_notas_texto_tamanho, 1 a 5000).
export const novaNotaSchema = z.object({
  lead_id: z.guid(),
  texto: z.string().trim().min(1).max(5000),
});

// Filtros da lista (/admin), vindos da URL (?status=&servico=&plano=&busca=&pagina=).
// A URL é de quem a digita: valor inválido é ignorado (vira "sem filtro"), nunca quebra a página.
export const filtrosLeadsSchema = z.object({
  status: statusLeadSchema.optional().catch(undefined),
  servico: servicoSchema.optional().catch(undefined),
  plano: planoSchema.optional().catch(undefined),
  busca: z
    .string()
    .trim()
    .max(100)
    .transform((v) => v || undefined)
    .optional()
    .catch(undefined),
  pagina: z.coerce.number().int().min(1).max(10_000).catch(1),
});
export type FiltrosLeads = z.infer<typeof filtrosLeadsSchema>;

// Endereço da lista com os mesmos filtros, noutra página (links de paginação).
export function urlLista(filtros: FiltrosLeads, pagina: number) {
  const params = new URLSearchParams();
  for (const campo of ["status", "servico", "plano", "busca"] as const) {
    const valor = filtros[campo];
    if (valor) params.set(campo, valor);
  }
  if (pagina > 1) params.set("pagina", String(pagina));
  const query = params.toString();
  return query ? `/admin?${query}` : "/admin";
}
