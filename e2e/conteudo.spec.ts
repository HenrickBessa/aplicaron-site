import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const WCAG = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

const paginas = [
  "/",
  "/planos",
  "/produtos",
  "/produtos/agenda-cobranca",
  "/servicos/automacao-ia",
  "/servicos/sites",
  "/servicos/sistemas",
  "/servicos/aplicativos",
  "/clientes",
  "/clientes/emer",
  "/clientes/atacado-das-cestas",
  "/clientes/kavana",
  "/clientes/agi",
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

test("slug de cliente inexistente responde 404", async ({ page }) => {
  const resposta = await page.goto("/clientes/nao-existe");
  expect(resposta?.status()).toBe(404);
});

test("URLs antigas de /cases redirecionam permanentemente (308) para /clientes", async ({ request }) => {
  for (const antiga of ["/cases", "/cases/clinica-atendimento-ia"]) {
    const r = await request.get(antiga, { maxRedirects: 0 });
    expect(r.status(), antiga).toBe(308);
    expect(r.headers().location, antiga).toBe("/clientes");
  }
});

test("cartão de cliente na home leva à página do cliente, com logo", async ({ page }) => {
  await page.goto("/");
  const cartao = page.locator("#clientes").getByRole("link", { name: /Emer/ });
  await expect(cartao.getByRole("img", { name: "Logo Emer" })).toBeVisible();
  await cartao.click();
  await expect(page).toHaveURL("/clientes/emer");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Emer");
});

test("carrossel lista as tecnologias uma vez para leitor de tela", async ({ page }) => {
  await page.goto("/");
  const lista = page.getByRole("list", { name: "Tecnologias que utilizamos" });
  await expect(lista.getByRole("listitem")).toHaveCount(21);
  await expect(lista).toContainText("Next.js");
  await expect(lista).not.toContainText("OpenAI");
});

test("página de serviço leva ao diagnóstico com o serviço pré-selecionado", async ({ page }) => {
  await page.goto("/servicos/automacao-ia");
  const link = page.getByRole("link", { name: /Pedir diagnóstico/ });
  await expect(link).toHaveAttribute("href", "/diagnostico?servico=automacao_ia");
});

test("home lista todos os serviços e clientes do MDX", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#servicos > div > ul > li")).toHaveCount(4);
  await expect(page.locator("#clientes > div > ul > li")).toHaveCount(4);
});

test("case mostra o que mudou na nossa voz; depoimento em rascunho não vai para o HTML", async ({ page }) => {
  await page.goto("/clientes/agi");
  const resultado = page.getByRole("region", { name: "O que mudou" });
  await expect(resultado).toContainText("vê de onde veio cada contato");
  await expect(page.locator("blockquote")).toHaveCount(0);
  // HTML bruto, com o payload do React: o rascunho não pode estar em lugar nenhum.
  const html = await (await page.request.get("/clientes/agi")).text();
  expect(html).toContain("vê de onde veio cada contato");
  expect(html).not.toContain("Agora sabemos de onde vem cada contato");
});

test("nenhuma página mostra textos de rascunho", async ({ page }) => {
  for (const caminho of paginas) {
    await page.goto(caminho);
    await expect(page.locator("body"), caminho).not.toContainText(/rascunho|provisóri|fictíci|ilustrativ/i);
  }
});

test("botão 'Pausar animações' congela o que se move sozinho e lembra a escolha", async ({ page }) => {
  await page.goto("/");
  const botao = page.getByRole("button", { name: "Pausar animações" });
  await botao.click();
  await expect(page.getByRole("button", { name: "Retomar animações" })).toHaveAttribute("aria-pressed", "true");
  const estado = () =>
    page.evaluate(() => [".coluna-codigo", ".faixa-rolante", ".flutuar"].map((s) => getComputedStyle(document.querySelector(s)!).animationPlayState));
  expect(await estado()).toEqual(["paused", "paused", "paused"]);
  await page.reload();
  expect(await estado()).toEqual(["paused", "paused", "paused"]);
});

test.describe("com 'reduzir movimento' no sistema", () => {
  test.use({ reducedMotion: "reduce" });

  test("animações ficam paradas e o carrossel mostra tudo", async ({ page }) => {
    await page.goto("/");
    const animacoes = await page.evaluate(() =>
      [".coluna-codigo", ".faixa-rolante", ".flutuar", ".revelar"].map((s) => {
        const el = document.querySelector(s);
        return el ? getComputedStyle(el).animationName : "ausente";
      }),
    );
    expect(animacoes).toEqual(["none", "none", "none", "none"]);
  });
});

test("/obrigado tem noindex", async ({ page }) => {
  await page.goto("/obrigado");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
});

test("/privacidade mostra a versão vigente", async ({ page }) => {
  await page.goto("/privacidade");
  await expect(page.locator("time[datetime='2026-10-23']")).toHaveText("23 de outubro de 2026");
});
