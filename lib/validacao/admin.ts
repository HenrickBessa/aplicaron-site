import { z } from "@/lib/validacao/zod";
import { statusLeadSchema } from "./enums";

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
