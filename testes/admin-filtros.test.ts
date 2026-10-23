import { describe, expect, it } from "vitest";
import { filtrosLeadsSchema, mudarStatusSchema, novaNotaSchema, urlLista } from "@/lib/validacao/admin";

describe("filtrosLeadsSchema (searchParams da lista do /admin)", () => {
  it("sem parâmetros: sem filtro, página 1", () => {
    expect(filtrosLeadsSchema.parse({})).toEqual({ pagina: 1 });
  });

  it("valores válidos passam; a busca perde os espaços das pontas", () => {
    expect(
      filtrosLeadsSchema.parse({ status: "fechado", servico: "sites", plano: "vende", busca: "  ana  ", pagina: "3" }),
    ).toEqual({ status: "fechado", servico: "sites", plano: "vende", busca: "ana", pagina: 3 });
  });

  it("valor inválido vira 'sem filtro' em vez de quebrar a página", () => {
    expect(
      filtrosLeadsSchema.parse({ status: "ganho", servico: "", plano: ["vende", "presenca"], busca: "x".repeat(101), pagina: "-2" }),
    ).toEqual({ pagina: 1 });
    expect(filtrosLeadsSchema.parse({ busca: "   ", pagina: "abc" })).toEqual({ pagina: 1 });
    expect(filtrosLeadsSchema.parse({ pagina: "1.5" })).toEqual({ pagina: 1 });
  });
});

describe("urlLista", () => {
  it("mantém os filtros e só põe a página quando passa da primeira", () => {
    const filtros = filtrosLeadsSchema.parse({ status: "novo", busca: "acme & cia" });
    expect(urlLista(filtros, 1)).toBe("/admin?status=novo&busca=acme+%26+cia");
    expect(urlLista(filtros, 2)).toBe("/admin?status=novo&busca=acme+%26+cia&pagina=2");
    expect(urlLista({ pagina: 1 }, 1)).toBe("/admin");
  });
});

describe("Actions do CRM: validação", () => {
  const id = "3f2b1c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d";

  it("status: só os do enum, com lead_id e versão válidos", () => {
    expect(mudarStatusSchema.safeParse({ lead_id: id, status: "em_contato", versao: "2" }).success).toBe(true);
    expect(mudarStatusSchema.safeParse({ lead_id: id, status: "ganho", versao: "2" }).success).toBe(false);
    expect(mudarStatusSchema.safeParse({ lead_id: "abc", status: "novo", versao: "2" }).success).toBe(false);
    expect(mudarStatusSchema.safeParse({ lead_id: id, status: "novo", versao: null }).success).toBe(false);
  });

  it("nota: 1 a 5000 caracteres depois de tirar os espaços das pontas", () => {
    expect(novaNotaSchema.parse({ lead_id: id, texto: "  oi  " }).texto).toBe("oi");
    expect(novaNotaSchema.safeParse({ lead_id: id, texto: "   " }).success).toBe(false);
    expect(novaNotaSchema.safeParse({ lead_id: id, texto: "x".repeat(5001) }).success).toBe(false);
    expect(novaNotaSchema.safeParse({ lead_id: id, texto: "x".repeat(5000) }).success).toBe(true);
  });
});
