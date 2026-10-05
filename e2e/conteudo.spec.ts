import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const WCAG = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

const paginas = [
  "/",
  "/servicos/automacao-ia",
  "/servicos/sites",
  "/servicos/sistemas",
  "/servicos/aplicativos",
  "/cases/clinica-atendimento-ia",
  "/cases/distribuidora-sistema-pedidos",
  "/sobre",
  "/privacidade",
  "/obrigado",
];

for (const caminho of paginas) {
  test(`${caminho}: responde 200, tem um único h1 e passa no axe`, async ({ page }) => {
    const resposta = await page.goto(caminho);
    expect(resposta?.status()).toBe(200);
    await expect(page.locator("h1")).toHaveCount(1);
    const resultado = await new AxeBuilder({ page }).withTags(WCAG).analyze();
    expect(resultado.violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
  });
}

test("slug de serviço inexistente responde 404", async ({ page }) => {
  const resposta = await page.goto("/servicos/nao-existe");
  expect(resposta?.status()).toBe(404);
});

test("slug de case inexistente responde 404", async ({ page }) => {
  const resposta = await page.goto("/cases/nao-existe");
  expect(resposta?.status()).toBe(404);
});

test("página de serviço leva ao diagnóstico com o serviço pré-selecionado", async ({ page }) => {
  await page.goto("/servicos/automacao-ia");
  const link = page.getByRole("link", { name: /Pedir diagnóstico/ });
  await expect(link).toHaveAttribute("href", "/diagnostico?servico=automacao_ia");
});

test("home lista todos os serviços e cases do MDX", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#servicos li")).toHaveCount(4);
  await expect(page.locator("#cases li")).toHaveCount(2);
});

test("conteúdo provisório exibe o selo RASCUNHO", async ({ page }) => {
  await page.goto("/servicos/sites");
  await expect(page.getByText("Rascunho", { exact: true })).toBeVisible();
});

test("/obrigado tem noindex", async ({ page }) => {
  await page.goto("/obrigado");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
});

test("/privacidade mostra a versão vigente", async ({ page }) => {
  await page.goto("/privacidade");
  await expect(page.locator("time[datetime='2026-10-05']")).toHaveText("5 de outubro de 2026");
});
