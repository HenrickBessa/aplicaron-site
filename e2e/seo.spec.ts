import { expect, test, type Page } from "@playwright/test";

// O que o Google lê de cada página. A URL canônica é fixada no playwright.config.ts.
const BASE = "https://www.aplicaron.com.br";

const indexaveis = [
  "/",
  "/diagnostico",
  "/sobre",
  "/privacidade",
  "/servicos/automacao-ia",
  "/servicos/sites",
  "/servicos/sistemas",
  "/servicos/aplicativos",
  "/clientes",
  "/clientes/emer",
  "/clientes/atacado-das-cestas",
];

const meta = (page: Page, seletor: string) => page.locator(seletor).first().getAttribute("content");

async function jsonLd(page: Page) {
  const blocos = await page.locator('script[type="application/ld+json"]').allTextContents();
  return blocos.map((b) => JSON.parse(b));
}

for (const caminho of indexaveis) {
  test(`${caminho}: título, descrição, canonical e Open Graph`, async ({ page }) => {
    await page.goto(caminho);

    const titulo = await page.title();
    expect(titulo).toContain("AplicarOn");
    expect(titulo.length).toBeLessThanOrEqual(70);

    const descricao = (await meta(page, 'meta[name="description"]')) ?? "";
    expect(descricao.length).toBeGreaterThanOrEqual(50);
    expect(descricao.length).toBeLessThanOrEqual(160);

    const urlCanonica = caminho === "/" ? BASE : `${BASE}${caminho}`;
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", urlCanonica);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /^index, follow/);

    expect(await meta(page, 'meta[property="og:title"]')).toBeTruthy();
    expect(await meta(page, 'meta[property="og:description"]')).toBe(descricao);
    expect(await meta(page, 'meta[property="og:url"]')).toBe(urlCanonica);
    expect(await meta(page, 'meta[property="og:site_name"]')).toBe("AplicarOn");
    expect(await meta(page, 'meta[property="og:locale"]')).toBe("pt_BR");
    expect(await meta(page, 'meta[property="og:image"]')).toBe(`${BASE}/og.jpg`);
    expect(await meta(page, 'meta[name="twitter:card"]')).toBe("summary_large_image");

    await expect(page.locator("html")).toHaveAttribute("lang", "pt-BR");
    await expect(page.locator("h1")).toHaveCount(1);
  });
}

test("títulos e descrições são únicos entre as páginas", async ({ page }) => {
  const titulos = new Set<string>();
  const descricoes = new Set<string>();
  for (const caminho of indexaveis) {
    await page.goto(caminho);
    titulos.add(await page.title());
    descricoes.add((await meta(page, 'meta[name="description"]')) ?? "");
  }
  expect(titulos.size).toBe(indexaveis.length);
  expect(descricoes.size).toBe(indexaveis.length);
});

test("?servico= não cria página nova: canonical continua /diagnostico", async ({ page }) => {
  await page.goto("/diagnostico?servico=sites");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", `${BASE}/diagnostico`);
});

test("/obrigado e a 404 têm noindex (e nenhuma tag robots contraditória)", async ({ page }) => {
  for (const caminho of ["/obrigado", "/nao-existe"]) {
    await page.goto(caminho);
    // Na 404 o Next adiciona um noindex próprio: pode haver mais de uma tag, todas com noindex.
    const valores = await page.locator('meta[name="robots"]').evaluateAll((els) => els.map((e) => e.getAttribute("content")));
    expect(valores.length, caminho).toBeGreaterThan(0);
    for (const valor of valores) expect(valor, caminho).toMatch(/^noindex/);
  }
});

test("sitemap.xml: só páginas indexáveis, todas respondendo 200", async ({ request }) => {
  const r = await request.get("/sitemap.xml");
  expect(r.status()).toBe(200);
  const urls = [...(await r.text()).matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  expect(new Set(urls)).toEqual(new Set(indexaveis.map((c) => (c === "/" ? `${BASE}/` : `${BASE}${c}`))));
  for (const url of urls) {
    expect((await request.get(url.replace(BASE, ""))).status(), url).toBe(200);
  }
});

test("robots.txt: bloqueia /admin e /api, não bloqueia /obrigado, aponta o sitemap", async ({ request }) => {
  const texto = await (await request.get("/robots.txt")).text();
  expect(texto).toContain("Disallow: /admin");
  expect(texto).toContain("Disallow: /api/");
  expect(texto).not.toContain("/obrigado");
  expect(texto).toContain(`Sitemap: ${BASE}/sitemap.xml`);
});

test("home: JSON-LD Organization e WebSite", async ({ page }) => {
  await page.goto("/");
  const [dados] = await jsonLd(page);
  const tipos = dados["@graph"].map((n: { "@type": string }) => n["@type"]);
  expect(tipos).toEqual(["Organization", "WebSite"]);
  const org = dados["@graph"][0];
  expect(org).toMatchObject({ name: "AplicarOn", url: `${BASE}/`, logo: `${BASE}/icon.png`, email: "suporte@aplicaron.com.br" });
});

test("serviço: JSON-LD BreadcrumbList igual à trilha visível", async ({ page }) => {
  await page.goto("/servicos/sites");
  const breadcrumb = (await jsonLd(page)).find((d) => d["@type"] === "BreadcrumbList");
  expect(breadcrumb.itemListElement).toEqual([
    { "@type": "ListItem", position: 1, name: "Início", item: `${BASE}/` },
    { "@type": "ListItem", position: 2, name: "Serviços", item: `${BASE}/#servicos` },
    { "@type": "ListItem", position: 3, name: "Sites", item: `${BASE}/servicos/sites` },
  ]);
});

test("imagem de compartilhamento, ícones e manifest", async ({ request }) => {
  const og = await request.get("/og.jpg");
  expect(og.headers()["content-type"]).toBe("image/jpeg");
  for (const caminho of ["/icon.png", "/apple-icon.png"]) {
    expect((await request.get(caminho)).headers()["content-type"]).toBe("image/png");
  }
  const manifest = await (await request.get("/manifest.webmanifest")).json();
  expect(manifest).toMatchObject({ name: "AplicarOn", lang: "pt-BR" });
});
