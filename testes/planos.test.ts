import { beforeEach, describe, expect, it, vi } from "vitest";
import { addons, mensagemWhatsappPlano, planos, textoPrazo } from "@/conteudo/planos";
import { ADDONS, PLANOS } from "@/lib/validacao/enums";
import { planoFormSchema } from "@/lib/validacao/plano";

// A Action é testada isolada: banco e after() são simulados.
const criarLead = vi.fn();
const after = vi.fn();
vi.mock("@/lib/servicos/leads", () => ({ criarLead: (...a: unknown[]) => criarLead(...a) }));
vi.mock("next/server", () => ({ after: (...a: unknown[]) => after(...a) }));
vi.mock("next/headers", () => ({ headers: async () => new Headers({ "x-vercel-id": "gru1::teste" }) }));
vi.mock("@sentry/nextjs", () => ({ captureMessage: vi.fn() }));

const { enviarInteressePlano } = await import("@/app/(site)/planos/acoes");
const { VERSAO_POLITICA_VIGENTE } = await import("@/conteudo/privacidade");

const PESSOAL = { nome: "Carla Dias", email: "carla@clinica.com.br", whatsapp: "(68) 99999-1234", empresa: "Clínica X" };

const valido = {
  submission_id: "3f2b1c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d",
  plano: "vende",
  addons: ["crm", "manutencao_4h"],
  cidade: "Rio Branco/AC",
  segmento: "saúde",
  descricao: "site com agendamento e catálogo de serviços",
  ...PESSOAL,
  marketing_optin: false,
  tempo_preenchimento_ms: 30_000,
  site: "",
};

let logs: string[];
beforeEach(() => {
  criarLead.mockReset();
  after.mockReset();
  logs = [];
  for (const metodo of ["log", "warn", "error"] as const) {
    vi.spyOn(console, metodo).mockImplementation((...a) => void logs.push(a.join(" ")));
  }
});

describe("conteudo/planos", () => {
  it("cobre exatamente os planos e add-ons do banco", () => {
    expect(planos.map((p) => p.slug)).toEqual([...PLANOS]);
    expect(addons.map((a) => a.slug)).toEqual([...ADDONS]);
    expect(planos.filter((p) => p.destaque)).toHaveLength(1);
  });

  it("prazo em dias úteis, faixa ou a combinar", () => {
    expect(textoPrazo({ de: 10, ate: 10 })).toBe("10 dias úteis");
    expect(textoPrazo({ de: 15, ate: 20 })).toBe("15 a 20 dias úteis");
    expect(textoPrazo(null)).toContain("combinado");
  });

  it("mensagem do WhatsApp no formato do briefing", () => {
    expect(
      mensagemWhatsappPlano({
        plano: "vende",
        addons: ["crm", "manutencao_4h"],
        empresa: "Clínica X",
        cidade: "Rio Branco/AC",
        segmento: "saúde",
        descricao: "site com agendamento e catálogo de serviços",
      }),
    ).toBe(
      "Olá, AplicarOn! Vim pelo site.\nPlano: Vende\nAdd-ons: CRM, Manutenção evolutiva\n" +
        "Negócio: Clínica X — Rio Branco/AC — saúde\nPreciso de: site com agendamento e catálogo de serviços",
    );
  });

  it("mensagem sem add-ons nem negócio omite as linhas", () => {
    expect(mensagemWhatsappPlano({ plano: "presenca", addons: [], descricao: "um site simples" })).toBe(
      "Olá, AplicarOn! Vim pelo site.\nPlano: Presença\nPreciso de: um site simples",
    );
  });
});

describe("planoFormSchema", () => {
  it("e-mail é obrigatório (decisão de 23/10/2026)", () => {
    const r = planoFormSchema.safeParse({ ...valido, email: "" });
    expect(r.success).toBe(false);
  });

  it("add-on repetido vira um só; add-on desconhecido é recusado", () => {
    expect(planoFormSchema.parse({ ...valido, addons: ["crm", "crm"] }).addons).toEqual(["crm"]);
    expect(planoFormSchema.safeParse({ ...valido, addons: ["hackear"] }).success).toBe(false);
  });

  it("cidade e segmento opcionais, limpos e com até 80 caracteres", () => {
    const r = planoFormSchema.parse({ ...valido, cidade: "  ", segmento: "  oficina   mecânica " });
    expect(r.cidade).toBeUndefined();
    expect(r.segmento).toBe("oficina mecânica");
    expect(planoFormSchema.safeParse({ ...valido, cidade: "x".repeat(81) }).success).toBe(false);
  });
});

describe("enviarInteressePlano", () => {
  it("honeypot ou envio rápido: sucesso falso com link genérico, nada gravado", async () => {
    for (const entrada of [{ ...valido, site: "http://spam" }, { ...valido, tempo_preenchimento_ms: 500 }, "lixo"]) {
      const r = await enviarInteressePlano(entrada);
      expect(r).toMatchObject({ ok: true, whatsapp: expect.stringMatching(/^https:\/\/wa\.me\/5547988800836\?text=/) });
    }
    expect(criarLead).not.toHaveBeenCalled();
  });

  it("válido: grava com serviço derivado do plano e a política do servidor, e devolve o link com a mensagem", async () => {
    criarLead.mockResolvedValue({ criado: true, leadId: "lead-1" });
    const r = await enviarInteressePlano({ ...valido, politica_versao: "forjada" });

    expect(criarLead).toHaveBeenCalledWith(
      expect.objectContaining({
        servico: "sites",
        plano_interesse: "vende",
        addons: ["crm", "manutencao_4h"],
        whatsapp: "+5568999991234",
        politica_versao: VERSAO_POLITICA_VIGENTE,
      }),
    );
    expect(criarLead.mock.calls[0][0]).not.toHaveProperty("faixa_orcamento");
    expect(after).toHaveBeenCalledOnce();
    if (!r.ok) throw new Error("esperava ok");
    const texto = new URL(r.whatsapp).searchParams.get("text");
    expect(texto).toContain("Plano: Vende");
    expect(texto).toContain("Negócio: Clínica X — Rio Branco/AC — saúde");
  });

  it("Agenda + Cobrança vira serviço 'sistemas'", async () => {
    criarLead.mockResolvedValue({ criado: true, leadId: "lead-2" });
    await enviarInteressePlano({ ...valido, plano: "agenda_cobranca" });
    expect(criarLead).toHaveBeenCalledWith(expect.objectContaining({ servico: "sistemas", plano_interesse: "agenda_cobranca" }));
  });

  it("reenvio (criado = false): não agenda outra notificação", async () => {
    criarLead.mockResolvedValue({ criado: false, leadId: "lead-1" });
    expect((await enviarInteressePlano(valido)).ok).toBe(true);
    expect(after).not.toHaveBeenCalled();
  });

  it("inválido: erros por campo e log só com os NOMES dos campos", async () => {
    const r = await enviarInteressePlano({ ...valido, plano: "premium", email: "carla-sem-arroba" });
    expect(r).toEqual({ ok: false, erros: { plano: expect.any(String), email: expect.any(String) } });
    expect(logs.join("\n")).toContain("invalido:");
    expect(logs.join("\n")).not.toContain("carla-sem-arroba");
  });

  it("falha no banco: erro geral, sem dados pessoais no log nem na resposta", async () => {
    criarLead.mockRejectedValue(new Error("criar_lead falhou: 57014"));
    const r = await enviarInteressePlano(valido);
    expect(r).toEqual({ ok: false, erroGeral: "indisponivel" });
    const tudo = logs.join("\n") + JSON.stringify(r);
    for (const valor of [...Object.values(PESSOAL), "+5568999991234", "Rio Branco"]) expect(tudo).not.toContain(valor);
  });
});
