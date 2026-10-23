import { z } from "@/lib/validacao/zod";

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
