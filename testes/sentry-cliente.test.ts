import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// lib/sentry-cliente.ts: o SDK do navegador só é baixado com DSN, e com o filtro de privacidade.
const init = vi.fn();
const captureException = vi.fn();
let ouvintes: EventTarget;

async function carregarModulo(comDsn: boolean, falhaAoBaixar = false) {
  vi.resetModules();
  vi.doMock("@/lib/sentry-sdk", () => {
    if (falhaAoBaixar) throw new Error("rede");
    return { init, captureException, captureRouterTransitionStart: vi.fn() };
  });
  vi.doMock("@/lib/sentry-filtro", async (original) => {
    const real = await original<typeof import("@/lib/sentry-filtro")>();
    return { ...real, opcoesPrivacidade: { ...real.opcoesPrivacidade, enabled: comDsn } };
  });
  return import("@/lib/sentry-cliente");
}

const erroGlobal = (erro: Error) => Object.assign(new Event("error"), { error: erro });

beforeEach(() => {
  init.mockClear();
  captureException.mockClear();
  ouvintes = new EventTarget();
  vi.stubGlobal("addEventListener", ouvintes.addEventListener.bind(ouvintes));
  vi.stubGlobal("removeEventListener", ouvintes.removeEventListener.bind(ouvintes));
  vi.stubGlobal("document", { readyState: "loading" }); // o load ainda não aconteceu
  vi.stubGlobal("window", {});
});
afterEach(() => vi.unstubAllGlobals());

describe("Sentry no navegador", () => {
  it("sem DSN não baixa o SDK nem escuta erros", async () => {
    const { iniciarSentry, capturarErro } = await carregarModulo(false);
    iniciarSentry();
    capturarErro(new Error("x"));
    ouvintes.dispatchEvent(erroGlobal(new Error("y")));
    await new Promise((r) => setTimeout(r, 10));
    expect(init).not.toHaveBeenCalled();
    expect(captureException).not.toHaveBeenCalled();
  });

  it("erro antes do carregamento tardio baixa o SDK, com o filtro, e é enviado uma vez", async () => {
    const { iniciarSentry } = await carregarModulo(true);
    const { filtrarBreadcrumb, filtrarEvento } = await import("@/lib/sentry-filtro");
    iniciarSentry();
    const erro = new Error("cedo");
    ouvintes.dispatchEvent(erroGlobal(erro));
    await vi.waitFor(() => expect(captureException).toHaveBeenCalledWith(erro));
    expect(init).toHaveBeenCalledTimes(1);
    expect(init.mock.calls[0][0]).toMatchObject({ sendDefaultPii: false, beforeSend: filtrarEvento, beforeBreadcrumb: filtrarBreadcrumb });
    // Depois do init o próprio SDK escuta os erros globais: o nosso ouvinte sai.
    ouvintes.dispatchEvent(erroGlobal(new Error("depois")));
    await new Promise((r) => setTimeout(r, 10));
    expect(captureException).toHaveBeenCalledTimes(1);
  });

  it("falha ao baixar o SDK não quebra a página nem entra em laço", async () => {
    const { capturarErro } = await carregarModulo(true, true);
    expect(() => capturarErro(new Error("x"))).not.toThrow();
    await new Promise((r) => setTimeout(r, 10));
    expect(init).not.toHaveBeenCalled();
  });
});
