import { expect, test, type Page } from "@playwright/test";

const paginas = ["/", "/servicos/sites", "/clientes/emer", "/sobre", "/privacidade", "/diagnostico", "/obrigado", "/admin/entrar"];

// A CSP está em Report-Only: nada é bloqueado, mas o navegador dispara "securitypolicyviolation"
// para tudo que SERIA bloqueado. Coletamos esses eventos para saber se a política está pronta.
async function coletarViolacoes(page: Page) {
  await page.addInitScript(() => {
    (window as unknown as { __violacoes: string[] }).__violacoes = [];
    document.addEventListener("securitypolicyviolation", (e) => {
      (window as unknown as { __violacoes: string[] }).__violacoes.push(`${e.violatedDirective} ← ${e.blockedURI || "inline"}`);
    });
  });
  return () => page.evaluate(() => (window as unknown as { __violacoes: string[] }).__violacoes);
}

test("cabeçalhos de segurança presentes", async ({ request }) => {
  const r = await request.get("/");
  const h = r.headers();
  expect(h["strict-transport-security"]).toContain("max-age=63072000");
  expect(h["x-content-type-options"]).toBe("nosniff");
  expect(h["referrer-policy"]).toBe("strict-origin-when-cross-origin");
  expect(h["permissions-policy"]).toContain("camera=()");
  expect(h["x-frame-options"]).toBe("DENY");
  expect(h["content-security-policy"]).toBe("frame-ancestors 'none'");
  expect(h["x-powered-by"]).toBeUndefined();

  const csp = h["content-security-policy-report-only"];
  for (const diretiva of [
    "default-src 'self'",
    "font-src 'self'",
    "img-src 'self' data: blob:",
    "connect-src 'self'",
    "frame-src 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ]) {
    expect(csp).toContain(diretiva);
  }
});

for (const caminho of paginas) {
  test(`${caminho}: nenhuma violação da CSP`, async ({ page }) => {
    const violacoes = await coletarViolacoes(page);
    await page.goto(caminho);
    await page.waitForLoadState("networkidle");
    expect(await violacoes()).toEqual([]);
  });
}

test("formulário de diagnóstico até a etapa 3 sem violações da CSP", async ({ page }) => {
  const violacoes = await coletarViolacoes(page);
  await page.goto("/diagnostico?servico=sites");
  await page.getByRole("button", { name: "Continuar" }).click();
  await page.getByLabel("Ainda não sei").check();
  await page.getByLabel("Conte sobre o projeto").fill("Teste de CSP no formulário.");
  await page.getByRole("button", { name: "Continuar" }).click();
  await expect(page.getByRole("heading", { level: 2, name: /Etapa 3 de 3/ })).toBeVisible();
  expect(await violacoes()).toEqual([]);
});

test("security.txt publicado com contato e validade (RFC 9116)", async ({ request }) => {
  const r = await request.get("/.well-known/security.txt");
  expect(r.status()).toBe(200);
  const texto = await r.text();
  expect(texto).toContain("Contact: mailto:suporte@aplicaron.com.br");
  // Expires precisa estar no futuro e a menos de 1 ano (recomendação da RFC).
  const expira = new Date(texto.match(/^Expires: (.+)$/m)![1]);
  expect(expira.getTime()).toBeGreaterThan(Date.now());
  expect(expira.getTime() - Date.now()).toBeLessThan(366 * 24 * 60 * 60 * 1000);
});
