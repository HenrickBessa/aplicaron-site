import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import { registrarEventoAsaas } from "@/lib/servicos/asaas";

// Integração com o Supabase local: a função de sistema grava uma vez por evento.
describe("registrarEventoAsaas (Supabase local)", () => {
  it("grava o evento e um reenvio do mesmo id não duplica", async () => {
    const evento = { id: `evt_${randomUUID()}`, event: "PAYMENT_CREATED", payment: { id: "pay_integracao" } };
    expect(await registrarEventoAsaas(evento)).toBe(true);
    expect(await registrarEventoAsaas(evento)).toBe(false);
  });
});
