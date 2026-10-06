import { describe, expect, it } from "vitest";
import { clientes } from "@/conteudo/clientes";
import { carregar, dadosServicoSchema } from "@/conteudo/esquemas";
import { VERSAO_POLITICA_VIGENTE, versoesPolitica } from "@/conteudo/privacidade";
import { servicos } from "@/conteudo/servicos";

describe("conteúdo MDX", () => {
  it("slugs de serviços e clientes são únicos e válidos para URL", () => {
    for (const lista of [servicos, clientes]) {
      const slugs = lista.map((item) => item.slug);
      expect(new Set(slugs).size).toBe(slugs.length);
      for (const slug of slugs) expect(slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
    }
  });

  it("cada serviço do site aponta para um tipo de serviço diferente", () => {
    const tipos = servicos.map((s) => s.dados.servico);
    expect(new Set(tipos).size).toBe(tipos.length);
  });

  it("todo cliente tem logo, site e pelo menos um serviço, e nenhum conteúdo é rascunho", () => {
    for (const c of clientes) {
      expect(c.logo, c.slug).toBeTruthy();
      expect(new URL(c.dados.site).protocol, c.slug).toBe("https:");
      expect(c.dados.servicos.length, c.slug).toBeGreaterThan(0);
    }
    for (const item of [...servicos, ...clientes]) expect(item.dados.rascunho, item.slug).toBe(false);
  });

  it("política vigente é a primeira da lista e as versões não se repetem", () => {
    expect(VERSAO_POLITICA_VIGENTE).toBe(versoesPolitica[0].dados.versao);
    const versoes = versoesPolitica.map((v) => v.dados.versao);
    expect(new Set(versoes).size).toBe(versoes.length);
  });

  it("dados inválidos em um MDX quebram com mensagem que cita o arquivo", () => {
    const modulo = { default: () => null, dados: { titulo: "X" } };
    expect(() => carregar(dadosServicoSchema, "quebrado", modulo)).toThrow(/quebrado\.mdx/);
  });
});
