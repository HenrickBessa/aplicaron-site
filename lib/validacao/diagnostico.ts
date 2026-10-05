import { z } from "zod";
import { faixaOrcamentoSchema, servicoSchema } from "./enums";

// Esquema ÚNICO do formulário de diagnóstico, usado no navegador (para dar erro na hora)
// e na Server Action (que é a validação que vale, porque o navegador pode ser burlado).
// Os limites espelham os CHECKs do banco: o que passa aqui, o banco aceita.

// "  Ana   Souza " -> "Ana Souza"
const textoLimpo = z.string().transform((v) => v.trim().replace(/\s+/g, " "));

// Aceita o jeito que as pessoas digitam no Brasil e converte para E.164 (+55DDNNNNNNNNN).
// (47) 98880-0836 -> +5547988800836 · 5547988800836 -> +5547988800836 · +351912345678 fica igual.
export function paraE164(entrada: string): string | null {
  const temMais = entrada.trim().startsWith("+");
  const digitos = entrada.replace(/\D/g, "");
  let e164: string;
  if (temMais) e164 = `+${digitos}`;
  else if (digitos.length === 10 || digitos.length === 11) e164 = `+55${digitos}`;
  else if ((digitos.length === 12 || digitos.length === 13) && digitos.startsWith("55")) e164 = `+${digitos}`;
  else return null;
  return /^\+[1-9][0-9]{7,14}$/.test(e164) ? e164 : null;
}

export const MENSAGENS = {
  servico: "Escolha o tipo de serviço.",
  faixa: "Escolha uma faixa de orçamento (pode ser “Ainda não sei”).",
  descricaoCurta: "Conte um pouco mais: pelo menos 10 caracteres.",
  descricaoLonga: "Use no máximo 2.000 caracteres.",
  nomeCurto: "Informe seu nome.",
  nomeLongo: "Use no máximo 120 caracteres.",
  email: "Informe um e-mail válido, como nome@empresa.com.br.",
  whatsapp: "Informe o WhatsApp com DDD, como (47) 98880-0836.",
  empresa: "Use no máximo 120 caracteres.",
} as const;

// ---------------------------------------------------------------------------
// Etapas (o navegador valida uma por vez antes de avançar)
// ---------------------------------------------------------------------------
export const etapaServicoSchema = z.object({
  servico: z.enum(servicoSchema.options, { error: MENSAGENS.servico }),
});

export const etapaProjetoSchema = z.object({
  faixa_orcamento: z.enum(faixaOrcamentoSchema.options, { error: MENSAGENS.faixa }),
  descricao: z
    .string()
    .trim()
    .min(10, MENSAGENS.descricaoCurta)
    .max(2000, MENSAGENS.descricaoLonga),
});

export const etapaContatoSchema = z.object({
  nome: textoLimpo.pipe(z.string().min(2, MENSAGENS.nomeCurto).max(120, MENSAGENS.nomeLongo)),
  email: z.string().trim().toLowerCase().max(254, MENSAGENS.email).pipe(z.email(MENSAGENS.email)),
  // Opcional: vazio vira undefined (NULL no banco); preenchido precisa virar E.164 válido.
  whatsapp: z
    .string()
    .optional()
    .transform((v, ctx) => {
      if (!v?.trim()) return undefined;
      const e164 = paraE164(v);
      if (!e164) {
        ctx.addIssue({ code: "custom", message: MENSAGENS.whatsapp });
        return z.NEVER;
      }
      return e164;
    }),
  empresa: z
    .string()
    .optional()
    .transform((v, ctx) => {
      const limpo = v?.trim().replace(/\s+/g, " ");
      if (!limpo) return undefined;
      if (limpo.length > 120) {
        ctx.addIssue({ code: "custom", message: MENSAGENS.empresa });
        return z.NEVER;
      }
      return limpo;
    }),
  marketing_optin: z.boolean().default(false),
});

// ---------------------------------------------------------------------------
// Envio completo (o que a Server Action recebe)
// ---------------------------------------------------------------------------
const origem = z
  .string()
  .optional()
  .transform((v) => (v?.trim() ? v.trim().slice(0, 200) : undefined));

export const diagnosticoSchema = etapaServicoSchema
  .extend(etapaProjetoSchema.shape)
  .extend(etapaContatoSchema.shape)
  .extend({
    submission_id: z.uuid(),
    pagina_origem: origem,
    utm_source: origem,
    utm_medium: origem,
    utm_campaign: origem,
  });

export type DiagnosticoEntrada = z.input<typeof diagnosticoSchema>;
export type Diagnostico = z.output<typeof diagnosticoSchema>;

export type CampoDiagnostico = keyof z.input<typeof etapaServicoSchema> | keyof z.input<typeof etapaProjetoSchema> | keyof z.input<typeof etapaContatoSchema>;
export type ErrosCampos = Partial<Record<CampoDiagnostico, string>>;

// Converte o erro do Zod em { campo: "primeira mensagem" } para exibir ao lado de cada campo.
export function errosPorCampo(erro: z.ZodError): ErrosCampos {
  const erros: ErrosCampos = {};
  for (const issue of erro.issues) {
    const campo = issue.path[0] as CampoDiagnostico | undefined;
    if (campo && !erros[campo]) erros[campo] = issue.message;
  }
  return erros;
}
