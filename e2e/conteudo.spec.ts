import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const WCAG = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

const paginas = [
  "/",
  "/planos",
  "/produtos",
  "/produtos/agenda-cobranca",
  "/produtos/aplicaragro",
  "/produtos/aplicarsaude",
  "/servicos/automacao-ia",
  "/servicos/sites",
  "/servicos/sistemas",
  "/servicos/aplicativos",
  "/clientes",
  "/clientes/emer",
  "/clientes/atacado-das-cestas",
  "/clientes/kavana",
  "/clientes/agi",
  "/clientes/bazar-bike-motos",
  "/sobre",
  "/henrick",
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
  await expect(page.locator("#clientes > div > ul > li")).toHaveCount(5);
});

test("home: posicionamento de pacotes e cartões de serviço que levam aos planos, ao produto ou ao diagnóstico", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Pacotes prontos para começar em dias");
  await expect(page.getByRole("link", { name: "Ver os planos" })).toHaveAttribute("href", "/planos");

  const servicos = page.locator("#servicos");
  await expect(servicos.getByRole("link", { name: "Presença" })).toHaveAttribute("href", "/planos");
  await expect(servicos.getByRole("link", { name: "Agenda + Cobrança" })).toHaveAttribute("href", "/produtos/agenda-cobranca");
  await expect(servicos.getByRole("link", { name: "diagnóstico gratuito" }).first()).toHaveAttribute(
    "href",
    /^\/diagnostico\?servico=/,
  );

  // O link de plano fica por cima do link do cartão: o clique vai para o plano, não para o serviço.
  await servicos.getByRole("link", { name: "Agenda + Cobrança" }).click();
  await expect(page).toHaveURL(/\/produtos\/agenda-cobranca$/);
  await page.goBack();
  await servicos.getByRole("link", { name: "Sites", exact: true }).click();
  await expect(page).toHaveURL(/\/servicos\/sites$/);
});

test("case mostra o que mudou na nossa voz; depoimento em rascunho não vai para o HTML", async ({ page }) => {
  await page.goto("/clientes/agi");
  const resultado = page.getByRole("region", { name: "O que mudou" });
  await expect(resultado).toContainText("vê de onde veio cada contato");
  await expect(page.locator("blockquote")).toHaveCount(0);
  await expect(page.getByText("Tecnologias:").locator("..")).toContainText("Supabase");
  // HTML bruto, com o payload do React: o rascunho não pode estar em lugar nenhum.
  const html = await (await page.request.get("/clientes/agi")).text();
  expect(html).toContain("vê de onde veio cada contato");
  expect(html).not.toContain("Agora sabemos de onde vem cada contato");
});

test("nenhuma página mostra textos de rascunho", async ({ page }) => {
  for (const caminho of paginas) {
    await page.goto(caminho);
    await expect(page.locator("body"), caminho).not.toContainText(/rascunho|provisóri|fictíci|ilustrativ|\[confirmar com/i);
  }
});

test("/henrick: projetos e produtos saem do conteúdo, com links para o case e o site, e sem chamada de diagnóstico", async ({ page }) => {
  await page.goto("/henrick");
  const projetos = page.getByRole("region", { name: "Projetos" });
  await expect(projetos.getByRole("heading", { level: 3 })).toHaveCount(5);
  await expect(projetos.getByRole("link", { name: "Ver o case Emer" })).toHaveAttribute("href", "/clientes/emer");
  await expect(projetos.getByRole("link", { name: /^emermedicosonline\.com\.br/ })).toHaveAttribute("href", "https://www.emermedicosonline.com.br/");
  await expect(projetos).toContainText("Tecnologias: Next.js · TypeScript");
  const produtos = page.getByRole("region", { name: "Produtos próprios" });
  await expect(produtos.getByRole("heading", { level: 3 })).toHaveCount(3);
  await expect(produtos).toContainText("Em piloto");
  await expect(page.getByRole("heading", { name: "Vamos tirar seu projeto do papel?" })).toHaveCount(0);
  await page.goto("/sobre");
  await expect(page.getByRole("link", { name: "Henrick Bessa" })).toHaveAttribute("href", "/henrick");
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

// Um loading.tsx no grupo (site) faz o React esconder o conteúdo no fim do HTML e
// revelá-lo por script: sem JavaScript, a página ficava só no "Carregando…".
test.describe("sem JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  for (const caminho of ["/", "/planos", "/diagnostico", "/servicos/sites", "/clientes/agi", "/produtos/agenda-cobranca"]) {
    test(`${caminho}: o conteúdo já vem no HTML`, async ({ page }) => {
      await page.goto(caminho);
      await expect(page.locator("h1")).toBeVisible();
      await expect(page.getByText("Carregando…")).toHaveCount(0);
    });
  }
});

test("/obrigado tem noindex", async ({ page }) => {
  await page.goto("/obrigado");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
});

test("/privacidade mostra a versão vigente", async ({ page }) => {
  await page.goto("/privacidade");
  await expect(page.locator("time[datetime='2026-10-23']")).toHaveText("23 de outubro de 2026");
});
