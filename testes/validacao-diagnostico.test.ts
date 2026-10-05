import { describe, expect, it } from "vitest";
import {
  diagnosticoSchema,
  errosPorCampo,
  etapaContatoSchema,
  etapaProjetoSchema,
  etapaServicoSchema,
  MENSAGENS,
  paraE164,
} from "@/lib/validacao/diagnostico";

const valido = {
  submission_id: "3f2b1c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d",
  servico: "sites",
  faixa_orcamento: "5k_15k",
  descricao: "Quero um site institucional novo.",
  nome: "Ana Souza",
  email: "ana@empresa.com.br",
  whatsapp: "",
  empresa: "",
  marketing_optin: false,
};

describe("paraE164", () => {
  it.each([
    ["(47) 98880-0836", "+5547988800836"],
    ["47 98880 0836", "+5547988800836"],
    ["4733334444", "+554733334444"],
    ["5547988800836", "+5547988800836"],
    ["+55 47 98880-0836", "+5547988800836"],
    ["+351 912 345 678", "+351912345678"],
  ])("%s -> %s", (entrada, esperado) => {
    expect(paraE164(entrada)).toBe(esperado);
  });

  it.each(["988800836", "123", "+0123456789", "abc", "+1234567890123456"])("rejeita %s", (entrada) => {
    expect(paraE164(entrada)).toBeNull();
  });
});

describe("etapas", () => {
  it("serviço vazio ou fora do enum dá a mensagem amigável", () => {
    for (const servico of ["", "hackear", undefined]) {
      const r = etapaServicoSchema.safeParse({ servico });
      expect(r.success).toBe(false);
      if (!r.success) expect(errosPorCampo(r.error).servico).toBe(MENSAGENS.servico);
    }
  });

  it("descrição curta é rejeitada mesmo com espaços em volta", () => {
    const r = etapaProjetoSchema.safeParse({ faixa_orcamento: "nao_sei", descricao: "   curta    " });
    expect(r.success).toBe(false);
    if (!r.success) expect(errosPorCampo(r.error).descricao).toBe(MENSAGENS.descricaoCurta);
  });

  it("contato: normaliza nome, e-mail, WhatsApp e empresa", () => {
    const r = etapaContatoSchema.parse({
      nome: "  Ana    Souza ",
      email: "  Ana@Empresa.COM.br ",
      whatsapp: "(47) 98880-0836",
      empresa: "  ACME   Ltda ",
    });
    expect(r).toEqual({
      nome: "Ana Souza",
      email: "ana@empresa.com.br",
      whatsapp: "+5547988800836",
      empresa: "ACME Ltda",
      marketing_optin: false,
    });
  });

  it("contato: WhatsApp e empresa vazios viram undefined", () => {
    const r = etapaContatoSchema.parse({ nome: "Ana", email: "ana@ex.com", whatsapp: "  ", empresa: "" });
    expect(r.whatsapp).toBeUndefined();
    expect(r.empresa).toBeUndefined();
  });

  it("contato: erros por campo com as mensagens em português", () => {
    const r = etapaContatoSchema.safeParse({ nome: "A", email: "ana@", whatsapp: "123", empresa: "x".repeat(121) });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(errosPorCampo(r.error)).toEqual({
        nome: MENSAGENS.nomeCurto,
        email: MENSAGENS.email,
        whatsapp: MENSAGENS.whatsapp,
        empresa: MENSAGENS.empresa,
      });
    }
  });
});

describe("diagnosticoSchema (envio completo)", () => {
  it("aceita um envio válido", () => {
    expect(diagnosticoSchema.safeParse(valido).success).toBe(true);
  });

  it("exige submission_id em formato UUID", () => {
    expect(diagnosticoSchema.safeParse({ ...valido, submission_id: "123" }).success).toBe(false);
  });

  it("corta origem e UTMs em 200 caracteres e descarta vazios", () => {
    const r = diagnosticoSchema.parse({ ...valido, utm_campaign: "x".repeat(300), utm_source: "  " });
    expect(r.utm_campaign).toHaveLength(200);
    expect(r.utm_source).toBeUndefined();
  });

  it("ignora campos extras (ex.: honeypot ou status) em vez de repassá-los", () => {
    const r = diagnosticoSchema.parse({ ...valido, status: "fechado", site: "spam" });
    expect(r).not.toHaveProperty("status");
    expect(r).not.toHaveProperty("site");
  });
});
