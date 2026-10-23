import { expect, test } from "@playwright/test";

// Layout shift (CLS): o que aparece depois do primeiro desenho não pode empurrar o que já estava na tela.
// Os testes comparam caixas em vez de medir o CLS do navegador, que varia com a carga da máquina.

for (const viewport of [
  { width: 390, height: 844 },
  { width: 1280, height: 800 },
]) {
  test(`diagnóstico: esqueleto tem a altura do formulário (${viewport.width}px)`, async ({ page }) => {
    await page.setViewportSize(viewport);

    // Sem os arquivos de JavaScript o formulário não monta e o esqueleto fica na tela.
    await page.route("**/_next/static/chunks/*.js", (rota) => rota.abort());
    await page.goto("/diagnostico");
    const esqueleto = await page.locator("div[inert]").locator("..").boundingBox();

    await page.unrouteAll();
    await page.goto("/diagnostico");
    await expect(page.getByRole("heading", { level: 2, name: /Etapa 1 de 3/ })).toBeVisible();
    const formulario = await page.locator("form").boundingBox();

    expect(esqueleto?.height).toBeGreaterThan(300);
    expect(Math.abs(esqueleto!.height - formulario!.height)).toBeLessThanOrEqual(1);
  });
}

test("balão do WhatsApp aparece sem mudar a caixa do botão flutuante", async ({ page }) => {
  await page.clock.install();
  await page.goto("/");
  const caixa = page.getByRole("link", { name: /Fale com a AplicarOn no WhatsApp/ }).locator("..");
  const antes = await caixa.boundingBox();

  await page.clock.runFor(2_000);
  await expect(page.getByRole("dialog", { name: "Vamos criar o seu sonho!!" })).toBeVisible();
  expect(await caixa.boundingBox()).toEqual(antes);
});
