import * as z from "./zod";
import { etapaContatoSchema, MENSAGENS, origem } from "./diagnostico";
import { addonSchema, planoSchema } from "./enums";

// Esquema do formulário "Quero este plano" (navegador + Server Action).
// Contato igual ao do diagnóstico (e-mail obrigatório, decisão de 23/10/2026); sem faixa de orçamento.

export const MENSAGENS_PLANO = {
  plano: "Escolha um plano.",
  addons: "Escolha add-ons da lista.",
  cidade: "Use no máximo 80 caracteres.",
  segmento: "Use no máximo 80 caracteres.",
} as const;

// Vazio vira undefined (NULL no banco); preenchido é limpo e limitado a `max`.
const textoOpcional = (max: number, mensagem: string) =>
  z
    .string()
    .optional()
    .transform((v, ctx) => {
      const limpo = v?.trim().replace(/\s+/g, " ");
      if (!limpo) return undefined;
      if (limpo.length > max) {
        ctx.addIssue({ code: "custom", message: mensagem });
        return z.NEVER;
      }
      return limpo;
    });

export const planoFormSchema = etapaContatoSchema.extend({
  plano: z.enum(planoSchema.options, { error: MENSAGENS_PLANO.plano }),
  addons: z
    .array(z.enum(addonSchema.options, { error: MENSAGENS_PLANO.addons }))
    .max(3, MENSAGENS_PLANO.addons)
    .default([])
    .transform((lista) => [...new Set(lista)]),
  cidade: textoOpcional(80, MENSAGENS_PLANO.cidade),
  segmento: textoOpcional(80, MENSAGENS_PLANO.segmento),
  descricao: z.string().trim().min(10, MENSAGENS.descricaoCurta).max(2000, MENSAGENS.descricaoLonga),
});

export const interessePlanoSchema = planoFormSchema.extend({
  submission_id: z.uuid(),
  pagina_origem: origem,
  utm_source: origem,
  utm_medium: origem,
  utm_campaign: origem,
});

export type InteressePlano = z.output<typeof interessePlanoSchema>;
export type CampoPlano = keyof z.input<typeof planoFormSchema>;
export type ErrosPlano = Partial<Record<CampoPlano, string>>;
