import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";
import { criarLead } from "@/lib/servicos/leads";
import { clienteSistema } from "@/lib/supabase/sistema";
import { diagnosticoSchema } from "@/lib/validacao/diagnostico";

// Integração de verdade com o Supabase local (npm run db:start).
// As variáveis vêm de testes/integracao/ambiente.ts (lê `supabase status`).

function dados(extra: Record<string, unknown> = {}) {
  const base = diagnosticoSchema.parse({
    submission_id: randomUUID(),
    servico: "sistemas",
    faixa_orcamento: "15k_50k",
    descricao: "Sistema de pedidos para distribuidora.",
    nome: "Teste Integração",
    email: "integracao@ex.com",
    whatsapp: "(47) 98880-0836",
    marketing_optin: true,
  });
  return { ...base, politica_versao: "2026-10-05", ...extra };
}

describe("criarLead (Supabase local)", () => {
  it("cria o lead e um reenvio do mesmo submission_id não duplica", async () => {
    const entrada = dados();
    const primeiro = await criarLead(entrada);
    expect(primeiro.criado).toBe(true);

    const segundo = await criarLead(entrada);
    expect(segundo).toEqual({ criado: false, leadId: primeiro.leadId });
  });

  it("o lead entra na fila de notificação com serviço e faixa (sem dados pessoais)", async () => {
    const { leadId } = await criarLead(dados());
    const { data, error } = await clienteSistema()
      .schema("sistema")
      .rpc("reivindicar_notificacoes", { p_limite: 1, p_lead_id: leadId });
    expect(error).toBeNull();
    expect(data).toEqual([{ id: leadId, tentativa: 1, servico: "sistemas", faixa_orcamento: "15k_50k", plano_interesse: null }]);
  });

  it("lead da página de planos: sem faixa, com plano e add-ons", async () => {
    const { leadId } = await criarLead(
      dados({ faixa_orcamento: undefined, plano_interesse: "vende", addons: ["crm"], cidade: "Rio Branco/AC", segmento: "saúde" }),
    );
    const { data, error } = await clienteSistema()
      .schema("sistema")
      .rpc("reivindicar_notificacoes", { p_limite: 1, p_lead_id: leadId });
    expect(error).toBeNull();
    expect(data).toEqual([{ id: leadId, tentativa: 1, servico: "sistemas", faixa_orcamento: null, plano_interesse: "vende" }]);
  });

  it("o banco rejeita o que escapar da validação (e-mail com maiúsculas)", async () => {
    await expect(criarLead(dados({ email: "Fora@Do.Padrao" }))).rejects.toThrow("criar_lead falhou: 23514");
  });

  it("a chave secret não lê a tabela leads diretamente", async () => {
    const { error } = await clienteSistema().from("leads").select("id").limit(1);
    expect(error?.code).toBe("42501");
  });

  it("a chave publishable (navegador) não chama funções de sistema", async () => {
    const publico = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
      auth: { persistSession: false },
    });
    // anonimizar_vencidos não tem parâmetros: a chamada chega até a checagem de permissão.
    const { error } = await publico.schema("sistema").rpc("anonimizar_vencidos");
    expect(error?.code).toBe("42501");
  });
});
