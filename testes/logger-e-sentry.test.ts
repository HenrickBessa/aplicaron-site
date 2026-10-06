import type { ErrorEvent } from "@sentry/nextjs";
import { beforeEach, describe, expect, it, vi } from "vitest";

const captureMessage = vi.fn();
vi.mock("@sentry/nextjs", () => ({ captureMessage: (...a: unknown[]) => captureMessage(...a) }));

const { log } = await import("@/lib/logger");
const { filtrarBreadcrumb, filtrarEvento } = await import("@/lib/sentry-filtro");

const PESSOAL = {
  nome: "Ana Souza",
  email: "ana@empresa.com.br",
  whatsapp: "+5547988800836",
  empresa: "ACME",
  descricao: "Projeto secreto",
  ip: "200.100.50.25",
  token: "sb_secret_abc",
};

let saida: string[];
beforeEach(() => {
  captureMessage.mockClear();
  saida = [];
  for (const metodo of ["log", "warn", "error"] as const) {
    vi.spyOn(console, metodo).mockImplementation((...a) => void saida.push(a.join(" ")));
  }
});

describe("logger", () => {
  it("só deixa sair os campos da lista permitida", () => {
    log.info("teste", { ...PESSOAL, lead_id: "lead-1", servico: "sites", codigo: "x", request_id: "r1" });
    const linha = JSON.parse(saida[0]);
    expect(linha).toEqual({ evento: "teste", nivel: "info", lead_id: "lead-1", servico: "sites", codigo: "x", request_id: "r1" });
    for (const valor of Object.values(PESSOAL)) expect(saida[0]).not.toContain(valor);
  });

  it("descarta objetos aninhados mesmo em campo permitido", () => {
    log.info("teste", { codigo: { email: PESSOAL.email } as unknown as string });
    expect(saida[0]).not.toContain(PESSOAL.email);
  });

  it("erro também vai ao Sentry, com os mesmos campos filtrados", () => {
    log.erro("falhou", { ...PESSOAL, codigo: "57014" });
    expect(captureMessage).toHaveBeenCalledWith("falhou", {
      level: "error",
      extra: { evento: "falhou", nivel: "erro", codigo: "57014" },
    });
  });

  it("aviso e info não vão ao Sentry", () => {
    log.aviso("a");
    log.info("b");
    expect(captureMessage).not.toHaveBeenCalled();
  });
});

describe("filtro do Sentry", () => {
  const evento = (url: string): ErrorEvent =>
    ({
      type: undefined,
      user: { ip_address: PESSOAL.ip, email: PESSOAL.email },
      request: {
        url,
        query_string: "busca=ana",
        data: { nome: PESSOAL.nome },
        cookies: { sessao: "abc" },
        headers: { cookie: "sessao=abc", "x-forwarded-for": PESSOAL.ip },
      },
    }) as ErrorEvent;

  it("remove corpo, cookies, cabeçalhos e usuário de qualquer evento", () => {
    const e = filtrarEvento(evento("https://www.aplicaron.com.br/diagnostico"));
    expect(e.request).toEqual({ url: "https://www.aplicaron.com.br/diagnostico", query_string: "busca=ana" });
    expect(e.user).toBeUndefined();
    expect(JSON.stringify(e)).not.toContain(PESSOAL.ip);
  });

  it("no /admin também remove a query string", () => {
    const e = filtrarEvento(evento("https://www.aplicaron.com.br/admin/leads?busca=ana"));
    expect(e.request).toEqual({ url: "https://www.aplicaron.com.br/admin/leads" });
  });

  it("breadcrumbs do console são descartados; os demais passam", () => {
    expect(filtrarBreadcrumb({ category: "console", message: PESSOAL.email })).toBeNull();
    expect(filtrarBreadcrumb({ category: "navigation" })).toEqual({ category: "navigation" });
  });
});
