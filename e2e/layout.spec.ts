import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

// Regras do axe para WCAG 2.0/2.1/2.2 níveis A e AA.
const WCAG = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

async function semViolacoes(page: import("@playwright/test").Page) {
  const resultado = await new AxeBuilder({ page }).withTags(WCAG).analyze();
  expect(resultado.violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
}

test.describe("layout", () => {
  test("home sem violações de acessibilidade", async ({ page }) => {
    await page.goto("/");
    await semViolacoes(page);
  });

  test("página 404 sem violações e com status 404", async ({ page }) => {
    const resposta = await page.goto("/pagina-que-nao-existe");
    expect(resposta?.status()).toBe(404);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Página não encontrada");
    await semViolacoes(page);
  });

  test("um único h1 por página", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("h1")).toHaveCount(1);
  });

  test("primeiro Tab mostra o link de pular, que leva o foco ao conteúdo", async ({ page }) => {
    await page.goto("/");
    await page.keyboard.press("Tab");
    const pular = page.getByRole("link", { name: "Pular para o conteúdo" });
    await expect(pular).toBeFocused();
    await expect(pular).toBeVisible();
    await page.keyboard.press("Enter");
    await expect(page.locator("main#conteudo")).toBeFocused();
  });

  test("elemento focado não fica escondido atrás do cabeçalho fixo", async ({ page }) => {
    await page.goto("/");
    // Um link no meio da página: o navegador rola até ele ao receber o foco.
    const alvo = page.locator("#clientes a").first();
    await alvo.focus();
    const cabecalho = await page.locator("body > header").boundingBox();
    const caixa = await alvo.boundingBox();
    expect(cabecalho && caixa).toBeTruthy();
    expect(caixa!.y).toBeGreaterThanOrEqual(cabecalho!.y + cabecalho!.height);
  });
});

test.describe("menu no celular", () => {
  test.use({ viewport: { width: 375, height: 740 } });

  test("abre, fecha com Esc e devolve o foco ao botão", async ({ page }) => {
    await page.goto("/");
    const botao = page.getByRole("button", { name: "Abrir menu" });
    await expect(botao).toHaveAttribute("aria-expanded", "false");

    await botao.click();
    const fechar = page.getByRole("button", { name: "Fechar menu" });
    await expect(fechar).toHaveAttribute("aria-expanded", "true");
    await expect(page.locator("#menu-movel")).toBeVisible();
    await semViolacoes(page);

    await page.keyboard.press("Escape");
    await expect(page.locator("#menu-movel")).toBeHidden();
    await expect(page.getByRole("button", { name: "Abrir menu" })).toBeFocused();
  });

  test("sem rolagem horizontal em 320px", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    await page.goto("/");
    const largura = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(largura).toBeLessThanOrEqual(320);
  });
});
