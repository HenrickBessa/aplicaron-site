import AxeBuilder from "@axe-core/playwright";
import { createClient } from "@supabase/supabase-js";
import { expect, test, type Page } from "@playwright/test";

const WCAG = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

async function semViolacoes(page: Page) {
  const r = await new AxeBuilder({ page }).withTags(WCAG).analyze();
  expect(r.violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
}

// O relógio do navegador é controlado pelo teste: "passamos" 5 s sem esperar de verdade,
// para não cair na regra anti-robô dos 3 s.
async function abrir(page: Page, caminho = "/diagnostico") {
  await page.clock.install();
  await page.goto(caminho);
  await expect(page.getByRole("heading", { level: 2, name: /Etapa 1 de 3/ })).toBeVisible();
}

async function preencherAteContato(page: Page) {
  await page.getByLabel(/^Site/).check();
  await page.getByRole("button", { name: "Continuar" }).click();
  await page.getByLabel("R$ 5 mil a R$ 15 mil").check();
  await page.getByLabel("Conte sobre o projeto").fill("Quero um site institucional para a minha empresa.");
  await page.getByRole("button", { name: "Continuar" }).click();
  await page.getByLabel("Nome", { exact: true }).fill("Teste E2E");
  await page.getByLabel("E-mail", { exact: true }).fill("E2E@Exemplo.com");
  await page.getByLabel(/WhatsApp/).fill("(47) 98880-0836");
}

const lerRascunho = (page: Page) =>
  page.evaluate(() => JSON.parse(sessionStorage.getItem("aplicaron:diagnostico") ?? "null"));

test("fluxo completo: 3 etapas, envio, /obrigado e lead gravado", async ({ page }) => {
  await abrir(page);
  await semViolacoes(page);

  await page.getByLabel(/^Site/).check();
  await page.getByRole("button", { name: "Continuar" }).click();

  // Foco vai para o título da nova etapa (leitor de tela anuncia "Etapa 2 de 3").
  await expect(page.getByRole("heading", { level: 2, name: /Etapa 2 de 3/ })).toBeFocused();
  await semViolacoes(page);
  await page.getByLabel("R$ 5 mil a R$ 15 mil").check();
  await page.getByLabel("Conte sobre o projeto").fill("Quero um site institucional para a minha empresa.");
  await page.getByRole("button", { name: "Continuar" }).click();

  await expect(page.getByRole("heading", { level: 2, name: /Etapa 3 de 3/ })).toBeFocused();
  await semViolacoes(page);
  await page.getByLabel("Nome", { exact: true }).fill("Teste E2E");
  await page.getByLabel("E-mail", { exact: true }).fill("E2E@Exemplo.com");
  await page.getByLabel(/WhatsApp/).fill("(47) 98880-0836");
  await expect(page.getByRole("link", { name: /política de privacidade/ })).toHaveAttribute("href", "/privacidade");

  const { submission_id } = await lerRascunho(page);
  await page.clock.fastForward(5_000);
  await page.getByRole("button", { name: "Enviar diagnóstico" }).click();

  await expect(page).toHaveURL("/obrigado");
  // Sucesso confirmado: rascunho apagado (a limpeza roda logo após a página montar).
  await expect.poll(() => lerRascunho(page)).toBeNull();

  // O lead existe: reenviar o mesmo submission_id pela função do banco devolve criado = false.
  const sistema = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!, { auth: { persistSession: false } });
  const { data } = await sistema.schema("sistema").rpc("criar_lead", {
    p_submission_id: submission_id,
    p_nome: "Conferência",
    p_email: "conf@ex.com",
    p_whatsapp: null,
    p_empresa: null,
    p_servico: "sites",
    p_faixa_orcamento: "5k_15k",
    p_descricao: "conferência do teste",
    p_politica_versao: "2026-10-05",
    p_marketing_optin: false,
  });
  expect(data).toEqual([{ id: expect.any(String), criado: false }]);
});

test("?servico= válido pré-seleciona; inválido é ignorado", async ({ page }) => {
  await abrir(page, "/diagnostico?servico=automacao_ia");
  await expect(page.getByLabel(/^Automação com IA/)).toBeChecked();

  await page.evaluate(() => sessionStorage.clear());
  await page.goto("/diagnostico?servico=hackear");
  await expect(page.getByRole("heading", { level: 2, name: /Etapa 1 de 3/ })).toBeVisible();
  await expect(page.getByRole("radio", { checked: true })).toHaveCount(0);
});

test("erros: resumo focado, campos marcados e link leva ao campo", async ({ page }) => {
  await abrir(page);
  await page.getByRole("button", { name: "Continuar" }).click();

  const resumo = page.getByText("Corrija 1 campo para continuar:").locator("..");
  await expect(resumo).toBeFocused();
  await semViolacoes(page);

  await page.getByLabel(/^Site/).check();
  await page.getByRole("button", { name: "Continuar" }).click();
  await page.getByLabel("Conte sobre o projeto").fill("curta");
  await page.getByRole("button", { name: "Continuar" }).click();

  const descricao = page.getByLabel("Conte sobre o projeto");
  await expect(descricao).toHaveAttribute("aria-invalid", "true");
  await expect(descricao).toHaveAccessibleDescription(/pelo menos 10 caracteres/);
  await semViolacoes(page);

  await page.getByRole("link", { name: /Descrição do projeto:/ }).click();
  await expect(descricao).toBeFocused();
});

test("recarregar a página mantém etapa, dados e submission_id", async ({ page }) => {
  await abrir(page);
  await preencherAteContato(page);
  const antes = await lerRascunho(page);

  await page.reload();
  await expect(page.getByRole("heading", { level: 2, name: /Etapa 3 de 3/ })).toBeVisible();
  await expect(page.getByLabel("Nome", { exact: true })).toHaveValue("Teste E2E");
  expect((await lerRascunho(page)).submission_id).toBe(antes.submission_id);
});

test("deploy no meio do preenchimento: mensagem de recarregar, dados preservados", async ({ page }) => {
  await abrir(page);
  await preencherAteContato(page);
  // Simula o servidor novo, que não conhece mais a Action da versão anterior.
  await page.route("**/diagnostico", (rota) =>
    rota.request().method() === "POST"
      ? rota.fulfill({ status: 404, headers: { "x-nextjs-action-not-found": "1" }, body: "" })
      : rota.continue(),
  );
  await page.clock.fastForward(5_000);
  await page.getByRole("button", { name: "Enviar diagnóstico" }).click();

  await expect(page.getByText("O site foi atualizado enquanto você preenchia.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Recarregar página" })).toBeVisible();
  await expect(page.getByLabel("Nome", { exact: true })).toHaveValue("Teste E2E");
  await semViolacoes(page);
});

test("servidor fora do ar: mensagem com WhatsApp, dados preservados", async ({ page }) => {
  await abrir(page);
  await preencherAteContato(page);
  await page.route("**/diagnostico", (rota) =>
    rota.request().method() === "POST" ? rota.fulfill({ status: 500, body: "" }) : rota.continue(),
  );
  await page.clock.fastForward(5_000);
  await page.getByRole("button", { name: "Enviar diagnóstico" }).click();

  await expect(page.getByText("Não conseguimos enviar agora.")).toBeVisible();
  await expect(page.getByRole("link", { name: /WhatsApp/ }).first()).toHaveAttribute("href", /wa\.me\/5547988800836/);
  await expect(page.getByLabel("E-mail", { exact: true })).toHaveValue("E2E@Exemplo.com");
});

test("envio rápido demais (robô) cai no sucesso falso e não grava", async ({ page }) => {
  await abrir(page);
  await preencherAteContato(page);
  const { submission_id } = await lerRascunho(page);
  // Sem avançar o relógio: menos de 3 s desde a abertura.
  await page.getByRole("button", { name: "Enviar diagnóstico" }).click();
  await expect(page).toHaveURL("/obrigado");

  const sistema = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!, { auth: { persistSession: false } });
  const { data } = await sistema.schema("sistema").rpc("criar_lead", {
    p_submission_id: submission_id,
    p_nome: "Conferência",
    p_email: "conf@ex.com",
    p_whatsapp: null,
    p_empresa: null,
    p_servico: "sites",
    p_faixa_orcamento: "5k_15k",
    p_descricao: "conferência do teste",
    p_politica_versao: "2026-10-05",
    p_marketing_optin: false,
  });
  // criado = true aqui prova que o envio do "robô" não tinha gravado nada.
  expect(data).toEqual([{ id: expect.any(String), criado: true }]);
});
