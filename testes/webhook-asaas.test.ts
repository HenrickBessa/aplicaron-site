import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const registrar = vi.fn(async () => true);
vi.mock("@/lib/servicos/asaas", () => ({ registrarEventoAsaas: (...a: unknown[]) => registrar(...(a as [])) }));
const avisos: unknown[] = [];
vi.mock("@/lib/logger", () => ({
  log: { info: vi.fn(), aviso: (...a: unknown[]) => avisos.push(a), erro: vi.fn() },
}));

const { POST } = await import("@/app/api/webhooks/asaas/route");

const TOKEN = "token-de-teste-com-pelo-menos-32-caracteres";
const evento = {
  id: "evt_05b708f961d739ea7eba7e4db318f621&368604920",
  event: "PAYMENT_RECEIVED",
  dateCreated: "2026-10-21 10:00:00",
  payment: { object: "payment", id: "pay_080225913252", customer: "cus_1", value: 149, billingType: "PIX" },
};

const chamar = (corpo: unknown, token: string | null = TOKEN) =>
  POST(
    new Request("https://www.aplicaron.com.br/api/webhooks/asaas", {
      method: "POST",
      headers: token === null ? {} : { "asaas-access-token": token },
      body: typeof corpo === "string" ? corpo : JSON.stringify(corpo),
    }),
  );

beforeEach(() => {
  registrar.mockReset().mockResolvedValue(true);
  avisos.length = 0;
  vi.stubEnv("ASAAS_WEBHOOK_TOKEN", TOKEN);
});
afterEach(() => vi.unstubAllEnvs());

describe("POST /api/webhooks/asaas", () => {
  it("sem token, com token errado ou sem ASAAS_WEBHOOK_TOKEN configurado: 401 e nada é gravado", async () => {
    expect((await chamar(evento, null)).status).toBe(401);
    expect((await chamar(evento, `${TOKEN}x`)).status).toBe(401);
    vi.stubEnv("ASAAS_WEBHOOK_TOKEN", "");
    expect((await chamar(evento, "")).status).toBe(401);
    expect(registrar).not.toHaveBeenCalled();
  });

  it("evento válido: grava só id, tipo e id da cobrança e responde 200", async () => {
    const r = await chamar(evento);
    expect(r.status).toBe(200);
    expect(await r.json()).toEqual({ ok: true });
    expect(registrar).toHaveBeenCalledWith({
      id: evento.id,
      event: "PAYMENT_RECEIVED",
      payment: { id: "pay_080225913252" },
    });
  });

  it("evento repetido também responde 200 (o Asaas entrega pelo menos uma vez)", async () => {
    registrar.mockResolvedValue(false);
    expect((await chamar(evento)).status).toBe(200);
  });

  it("corpo inválido: 200 sem gravar, e o log leva só os nomes dos campos", async () => {
    for (const corpo of ["não é json", { ...evento, payment: {} }, { ...evento, event: "pagamento" }]) {
      const r = await chamar(corpo);
      expect(r.status).toBe(200);
      expect(await r.json()).toEqual({ ok: true, ignorado: true });
    }
    expect(registrar).not.toHaveBeenCalled();
    expect(JSON.stringify(avisos)).toContain("invalido:payment.id");
    expect(JSON.stringify(avisos)).not.toContain("pay_080225913252");
  });

  it("falha ao gravar: 500, para o Asaas reenviar", async () => {
    registrar.mockRejectedValue(new Error("registrar_evento_asaas falhou: 08006"));
    expect((await chamar(evento)).status).toBe(500);
  });
});
