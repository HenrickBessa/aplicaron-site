import type { Page } from "@playwright/test";

// A CSP está em Report-Only: nada é bloqueado, mas o navegador dispara "securitypolicyviolation"
// para tudo que SERIA bloqueado. Coletamos esses eventos para saber se a política está pronta.
export async function coletarViolacoes(page: Page) {
  await page.addInitScript(() => {
    (window as unknown as { __violacoes: string[] }).__violacoes = [];
    document.addEventListener("securitypolicyviolation", (e) => {
      (window as unknown as { __violacoes: string[] }).__violacoes.push(`${e.violatedDirective} ← ${e.blockedURI || "inline"}`);
    });
  });
  return () => page.evaluate(() => (window as unknown as { __violacoes: string[] }).__violacoes);
}
