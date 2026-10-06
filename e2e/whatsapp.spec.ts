import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const WCAG = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];
const balao = (page: import("@playwright/test").Page) => page.getByRole("dialog", { name: "Vamos criar o seu sonho!!" });

test("botão flutuante abre o WhatsApp do número de contato com mensagem pronta", async ({ page }) => {
  await page.goto("/");
  const botao = page.getByRole("link", { name: /Fale com a AplicarOn no WhatsApp/ });
  await expect(botao).toBeVisible();
  await expect(botao).toHaveAttribute("target", "_blank");
  await expect(botao).toHaveAttribute("rel", /noopener/);
  const href = (await botao.getAttribute("href"))!;
  expect(href).toMatch(/^https:\/\/wa\.me\/5547988800836\?text=/);
  expect(decodeURIComponent(href.split("text=")[1])).toContain("Vim pelo site");
});

test("balão aparece ao entrar, sem roubar o foco, e passa no axe", async ({ page }) => {
  await page.goto("/");
  await expect(balao(page)).toBeVisible();
  await expect(page.locator("body")).toBeFocused();
  const r = await new AxeBuilder({ page }).withTags(WCAG).analyze();
  expect(r.violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
});

test("balão fecha no × e com Esc", async ({ page }) => {
  await page.goto("/");
  await balao(page).getByRole("button", { name: "Fechar mensagem" }).click();
  await expect(balao(page)).toBeHidden();

  await page.reload();
  await expect(balao(page)).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(balao(page)).toBeHidden();
});

test("balão aparece uma vez por visita: não volta ao navegar, volta ao recarregar", async ({ page }) => {
  await page.goto("/");
  await expect(balao(page)).toBeVisible();
  await page.keyboard.press("Escape");

  // Navegação dentro do site (sem recarregar a página).
  await page.locator("body > header").getByRole("link", { name: "Sobre" }).click();
  await expect(page).toHaveURL("/sobre");
  await page.waitForTimeout(2_500);
  await expect(balao(page)).toBeHidden();

  // Recarregar = nova visita para o balão.
  await page.reload();
  await expect(balao(page)).toBeVisible();
});

test("balão não aparece no diagnóstico (não distrai quem preenche)", async ({ page }) => {
  await page.goto("/diagnostico");
  await page.waitForTimeout(2_500);
  await expect(balao(page)).toBeHidden();
  await expect(page.getByRole("link", { name: /Fale com a AplicarOn no WhatsApp/ })).toBeVisible();
});

test.describe("com 'reduzir movimento' no sistema", () => {
  test.use({ reducedMotion: "reduce" });

  test("botão e balão aparecem sem animação", async ({ page }) => {
    await page.goto("/");
    await expect(balao(page)).toBeVisible();
    const animacoes = await page.evaluate(() =>
      [".whatsapp-flutuante", ".whatsapp-pulso", ".balao-entrada"].map((s) => getComputedStyle(document.querySelector(s)!).animationName),
    );
    expect(animacoes).toEqual(["none", "none", "none"]);
  });
});
