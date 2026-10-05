import { describe, expect, it } from "vitest";

// Teste de fumaça: só garante que o Vitest e o alias `@` funcionam.
// Pode ser apagado quando houver testes reais (fatia 4).
describe("ambiente de testes", () => {
  it("resolve o alias @ e importa server-only sem erro", async () => {
    await import("server-only");
    const pkg = await import("@/package.json");
    expect(pkg.default.name).toBe("aplicaron");
  });
});
