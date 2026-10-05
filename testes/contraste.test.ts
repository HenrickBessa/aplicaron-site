import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

// Lê os tokens de cor direto do CSS (fonte única) e confere o contraste WCAG 2.2 AA.
// Se alguém mudar uma cor e quebrar o contraste, este teste falha no CI.
const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
const tokens = Object.fromEntries(
  [...css.matchAll(/--color-([a-z-]+):\s*(#[0-9a-f]{6})/gi)].map(([, nome, cor]) => [nome, cor]),
);

function luminancia(hex: string) {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const canal = parseInt(hex.slice(i, i + 2), 16) / 255;
    return canal <= 0.03928 ? canal / 12.92 : ((canal + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contraste(a: string, b: string) {
  const [claro, escuro] = [luminancia(tokens[a]), luminancia(tokens[b])].sort((x, y) => y - x);
  return (claro + 0.05) / (escuro + 0.05);
}

// [frente, fundo, mínimo, motivo]
const pares: [string, string, number, string][] = [
  ["gelo", "azul-noite", 4.5, "texto principal no fundo"],
  ["gelo", "azul-profundo", 4.5, "texto principal no card"],
  ["cinza-azulado", "azul-noite", 4.5, "texto secundário no fundo"],
  ["cinza-azulado", "azul-profundo", 4.5, "texto secundário no card"],
  ["ciano", "azul-noite", 4.5, "link no fundo"],
  ["ciano", "azul-profundo", 4.5, "link no card"],
  ["azul-noite", "ciano", 4.5, "texto do botão primário"],
  ["erro", "azul-noite", 4.5, "mensagem de erro no fundo"],
  ["erro", "azul-profundo", 4.5, "mensagem de erro no card"],
  ["borda-campo", "azul-noite", 3, "borda de input no fundo (componente de interface)"],
  ["borda-campo", "azul-profundo", 3, "borda de input no card (componente de interface)"],
  ["ciano", "azul-profundo", 3, "anel de foco no card"],
];

describe("contraste dos tokens (WCAG 2.2 AA)", () => {
  it("encontra todos os tokens usados nos pares", () => {
    for (const [frente, fundo] of pares) {
      expect(tokens[frente], frente).toBeDefined();
      expect(tokens[fundo], fundo).toBeDefined();
    }
  });

  it.each(pares)("%s sobre %s ≥ %s:1 (%s)", (frente, fundo, minimo) => {
    expect(contraste(frente, fundo)).toBeGreaterThanOrEqual(minimo);
  });
});
