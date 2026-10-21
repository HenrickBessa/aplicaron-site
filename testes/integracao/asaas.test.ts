import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import { registrarEventoAsaas } from "@/lib/servicos/asaas";

// Integração com o Supabase local: a função de sistema grava uma vez por (ambiente, evento).
describe("registrarEventoAsaas (Supabase local)", () => {
  it("grava o evento, um reenvio no mesmo ambiente não duplica, e o outro ambiente é separado", async () => {
    const evento = { id: `evt_${randomUUID()}`, event: "PAYMENT_CREATED", payment: { id: "pay_integracao" } };
    expect(await registrarEventoAsaas(evento, "producao")).toBe(true);
    expect(await registrarEventoAsaas(evento, "producao")).toBe(false);
    expect(await registrarEventoAsaas(evento, "sandbox")).toBe(true);
  });
});
