import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const enviar = vi.fn(async () => 3);
vi.mock("@/lib/servicos/notificacoes", () => ({ enviar: (...a: unknown[]) => enviar(...(a as [])) }));

const { GET } = await import("@/app/api/cron/tarefas/route");

const chamar = (cabecalho?: string) =>
  GET(new Request("https://www.aplicaron.com.br/api/cron/tarefas", { headers: cabecalho ? { authorization: cabecalho } : {} }));

beforeEach(() => {
  enviar.mockClear();
  vi.stubEnv("CRON_SECRET", "segredo-de-teste-com-tamanho-razoavel");
});
afterEach(() => vi.unstubAllEnvs());

describe("GET /api/cron/tarefas", () => {
  it("sem cabeçalho: 401 e nada é processado", async () => {
    const r = await chamar();
    expect(r.status).toBe(401);
    expect(enviar).not.toHaveBeenCalled();
  });

  it("segredo errado (inclusive de tamanho diferente): 401", async () => {
    for (const cabecalho of ["Bearer errado", "Bearer segredo-de-teste-com-tamanho-razoaveX", "segredo-de-teste-com-tamanho-razoavel"]) {
      expect((await chamar(cabecalho)).status).toBe(401);
    }
    expect(enviar).not.toHaveBeenCalled();
  });

  it("CRON_SECRET não configurado: ninguém entra, nem com 'Bearer ' vazio", async () => {
    vi.stubEnv("CRON_SECRET", "");
    expect((await chamar("Bearer ")).status).toBe(401);
    expect((await chamar("Bearer undefined")).status).toBe(401);
    expect(enviar).not.toHaveBeenCalled();
  });

  it("segredo certo: processa até 20 notificações e devolve a contagem", async () => {
    const r = await chamar("Bearer segredo-de-teste-com-tamanho-razoavel");
    expect(r.status).toBe(200);
    expect(await r.json()).toEqual({ ok: true, enviadas: 3 });
    expect(enviar).toHaveBeenCalledWith(20);
  });
});
