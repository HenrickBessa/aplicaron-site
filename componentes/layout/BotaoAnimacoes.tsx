"use client";

import { useSyncExternalStore } from "react";

// WCAG 2.2.2 (Pausar, parar, ocultar): conteúdo que se move sozinho por mais de 5 s precisa
// de um controle para pausar. Este botão congela o código do fundo, o carrossel e a ilustração
// (ver html[data-animacoes="pausadas"] em globals.css) e lembra a escolha neste navegador.

const CHAVE = "aplicaron:animacoes";
const ouvintes = new Set<() => void>();

function pausadas() {
  return document.documentElement.dataset.animacoes === "pausadas";
}

function definir(pausar: boolean) {
  if (pausar) document.documentElement.dataset.animacoes = "pausadas";
  else delete document.documentElement.dataset.animacoes;
  try {
    localStorage.setItem(CHAVE, pausar ? "pausadas" : "ativas");
  } catch {
    // sem armazenamento: a escolha vale só nesta visita
  }
  ouvintes.forEach((avisar) => avisar());
}

// Aplica a preferência salva assim que este módulo carrega no navegador.
if (typeof window !== "undefined") {
  try {
    if (localStorage.getItem(CHAVE) === "pausadas") document.documentElement.dataset.animacoes = "pausadas";
  } catch {
    // sem armazenamento: animações seguem ativas
  }
}

function assinar(avisar: () => void) {
  ouvintes.add(avisar);
  return () => ouvintes.delete(avisar);
}

export function BotaoAnimacoes() {
  // No servidor (e até hidratar) assume "ativas"; depois lê o estado real do <html>.
  const estaoPausadas = useSyncExternalStore(assinar, pausadas, () => false);
  return (
    <button
      type="button"
      aria-pressed={estaoPausadas}
      onClick={() => definir(!estaoPausadas)}
      className="inline-flex min-h-6 items-center gap-2 rounded-sm text-xs text-cinza-azulado hover:text-ciano"
    >
      <span aria-hidden>{estaoPausadas ? "▶" : "❚❚"}</span>
      {estaoPausadas ? "Retomar animações" : "Pausar animações"}
    </button>
  );
}
