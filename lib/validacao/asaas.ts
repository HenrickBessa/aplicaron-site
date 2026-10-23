import * as z from "@/lib/validacao/zod";

// Corpo do webhook do Asaas: só o que gravamos. O resto (nome e CPF do pagador, valores...)
// é descartado aqui e nunca chega ao banco nem aos logs.
// O objeto `payment` pode vir só com `id`, conforme o evento (docs do Asaas).
export const eventoAsaasSchema = z.object({
  id: z.string().min(1).max(200),
  event: z.string().regex(/^[A-Z_]{1,80}$/),
  payment: z.object({ id: z.string().min(1).max(100) }),
});

export type EventoAsaas = z.infer<typeof eventoAsaasSchema>;
