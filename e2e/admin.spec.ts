import { randomUUID } from "node:crypto";
import AxeBuilder from "@axe-core/playwright";
import { createClient } from "@supabase/supabase-js";
import { expect, test, type Page } from "@playwright/test";
import { criarAdminTeste } from "../testes/apoio/admin";
import { codigoTotp } from "../testes/apoio/totp";

const WCAG = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

async function semViolacoes(page: Page) {
  const r = await new AxeBuilder({ page }).withTags(WCAG).analyze();
  expect(r.violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
}

async function entrar(page: Page, email: string, senha: string) {
  await page.goto("/admin/entrar");
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha").fill(senha);
  await page.getByRole("button", { name: "Entrar" }).click();
}

test("sem login, /admin manda para a tela de entrar (acessível)", async ({ page }) => {
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin\/entrar$/);
  await expect(page.getByRole("heading", { level: 1, name: "Entrar" })).toBeVisible();
  await semViolacoes(page);
});

test("senha errada: mensagem genérica e continua na tela de entrar", async ({ page }) => {
  const admin = await criarAdminTeste();
  await entrar(page, admin.email, "senha-errada");
  await expect(page.getByRole("alert").filter({ hasText: "E-mail ou senha incorretos." })).toBeVisible();
  await expect(page).toHaveURL(/\/admin\/entrar$/);
});

test("primeiro acesso: senha, cadastro do app autenticador, leads e sair", async ({ page }) => {
  const admin = await criarAdminTeste();
  const nomeLead = `Lead E2E ${randomUUID().slice(0, 8)}`;
  const { error } = await createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!)
    .schema("sistema")
    .rpc("criar_lead", {
      p_submission_id: randomUUID(),
      p_nome: nomeLead,
      p_email: "lead-e2e@ex.com",
      p_whatsapp: null,
      p_empresa: null,
      p_servico: "sites",
      p_faixa_orcamento: "nao_sei",
      p_descricao: "Lead criado pelo teste do admin.",
      p_politica_versao: "2026-10-05",
      p_marketing_optin: false,
      p_pagina_origem: null,
      p_utm_source: null,
      p_utm_medium: null,
      p_utm_campaign: null,
    });
  expect(error).toBeNull();

  await entrar(page, admin.email, admin.senha);
  await expect(page).toHaveURL(/\/admin\/mfa$/);
  await expect(page.getByRole("heading", { level: 1, name: "Cadastre o app autenticador" })).toBeVisible();

  // Só com a senha, o admin ainda não entra: volta para o código.
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin\/mfa$/);

  await page.getByRole("button", { name: "Gerar QR code" }).click();
  const segredo = await page.getByTestId("segredo-totp").textContent();
  await expect(page.getByRole("img", { name: /QR code/ })).toBeVisible();
  await semViolacoes(page);

  await page.getByLabel("Código de 6 números").fill("000000");
  await page.getByRole("button", { name: "Confirmar" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "Código inválido" })).toBeVisible();

  await page.getByLabel("Código de 6 números").fill(codigoTotp(segredo!));
  await page.getByRole("button", { name: "Confirmar" }).click();
  await expect(page).toHaveURL(/\/admin$/);
  await expect(page.getByRole("cell", { name: nomeLead })).toBeVisible();
  await semViolacoes(page);

  await page.getByRole("button", { name: "Sair" }).click();
  await expect(page).toHaveURL(/\/admin\/entrar$/);
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin\/entrar$/);
});

// Admin novo, já com o app autenticador cadastrado e a sessão em aal2.
async function entrarComMfa(page: Page) {
  const admin = await criarAdminTeste();
  await entrar(page, admin.email, admin.senha);
  await page.getByRole("button", { name: "Gerar QR code" }).click();
  const segredo = (await page.getByTestId("segredo-totp").textContent())!;
  await page.getByLabel("Código de 6 números").fill(codigoTotp(segredo));
  await page.getByRole("button", { name: "Confirmar" }).click();
  await expect(page).toHaveURL(/\/admin$/);
}

async function criarLeadTeste(nome: string) {
  const { data, error } = await createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!)
    .schema("sistema")
    .rpc("criar_lead", {
      p_submission_id: randomUUID(),
      p_nome: nome,
      p_email: "lead-crm-e2e@ex.com",
      p_whatsapp: "+5547988800836",
      p_empresa: "Padaria E2E",
      p_servico: "sites",
      p_faixa_orcamento: null,
      p_descricao: "Quero um site com cardápio.",
      p_politica_versao: "2026-10-23",
      p_marketing_optin: false,
      p_pagina_origem: "/planos",
      p_utm_source: "instagram",
      p_utm_medium: null,
      p_utm_campaign: null,
      p_plano_interesse: "vende",
      p_addons: ["crm"],
      p_cidade: "Joinville/SC",
      p_segmento: "alimentação",
    });
  expect(error).toBeNull();
  return (data as { id: string }[])[0].id;
}

test("CRM: busca, detalhe, status, nota e filtro (acessível)", async ({ page }) => {
  const marca = randomUUID().slice(0, 8);
  const nome = `Lead CRM ${marca}`;
  const id = await criarLeadTeste(nome);
  await entrarComMfa(page);

  await page.getByLabel("Buscar").fill(marca);
  await page.getByRole("button", { name: "Filtrar" }).click();
  await expect(page).toHaveURL(new RegExp(`busca=${marca}`));
  await expect(page.getByRole("status").filter({ hasText: "1 lead com estes filtros" })).toBeVisible();
  await semViolacoes(page);

  await page.getByRole("link", { name: nome }).click();
  await expect(page).toHaveURL(`/admin/leads/${id}`);
  await expect(page.getByRole("heading", { level: 1, name: nome })).toBeVisible();
  await expect(page.getByText("Vende", { exact: true })).toBeVisible();
  await expect(page.getByText("Joinville/SC")).toBeVisible();
  await expect(page.getByText("O status ainda não mudou.")).toBeVisible();
  await semViolacoes(page);

  await page.getByLabel("Status").selectOption("em_contato");
  await page.getByRole("button", { name: "Salvar status" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Status salvo." })).toBeVisible();
  await expect(page.getByRole("listitem").filter({ hasText: "Novo → Em contato" })).toBeVisible();

  await page.getByLabel("Nova nota").fill("Liguei; pediu a proposta por e-mail.");
  await page.getByRole("button", { name: "Adicionar nota" }).click();
  await expect(page.getByRole("listitem").filter({ hasText: "Liguei; pediu a proposta por e-mail." })).toBeVisible();
  await expect(page.getByLabel("Nova nota")).toHaveValue("");
  await semViolacoes(page);

  await page.goto(`/admin?busca=${marca}&status=em_contato`);
  await expect(page.getByRole("link", { name: nome })).toBeVisible();
  await page.getByLabel("Status").selectOption("fechado");
  await page.getByRole("button", { name: "Filtrar" }).click();
  await expect(page.getByRole("status").filter({ hasText: "0 leads com estes filtros" })).toBeVisible();
  await expect(page.getByRole("link", { name: nome })).toHaveCount(0);
});

test("link do e-mail: sem login vai para entrar; logado abre o detalhe; id inexistente mostra não encontrado", async ({ page }) => {
  const nome = `Lead link ${randomUUID().slice(0, 8)}`;
  const id = await criarLeadTeste(nome);

  await page.goto(`/admin/leads/${id}`);
  await expect(page).toHaveURL(/\/admin\/entrar$/);

  await entrarComMfa(page);
  await page.goto(`/admin/leads/${id}`);
  await expect(page.getByRole("heading", { level: 1, name: nome })).toBeVisible();

  // O admin tem loading.tsx: a resposta já começou (status 200) quando o notFound() roda, e o
  // Next mostra a tela de não encontrado com noindex. Id inexistente e id inválido: mesma resposta.
  for (const outro of [randomUUID(), "nao-e-um-id"]) {
    await page.goto(`/admin/leads/${outro}`);
    await expect(page.getByRole("heading", { level: 1, name: "Página não encontrada" })).toBeVisible();
    await expect(page.locator('meta[name="robots"][content*="noindex"]').first()).toBeAttached();
  }
  await semViolacoes(page);
});

test("segundo acesso: pede só o código, sem novo QR code", async ({ page }) => {
  const admin = await criarAdminTeste();
  await entrar(page, admin.email, admin.senha);
  await page.getByRole("button", { name: "Gerar QR code" }).click();
  const segredo = (await page.getByTestId("segredo-totp").textContent())!;
  await page.getByLabel("Código de 6 números").fill(codigoTotp(segredo));
  await page.getByRole("button", { name: "Confirmar" }).click();
  await expect(page).toHaveURL(/\/admin$/);
  await page.getByRole("button", { name: "Sair" }).click();

  await entrar(page, admin.email, admin.senha);
  await expect(page.getByRole("heading", { level: 1, name: "Código de acesso" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Gerar QR code" })).toHaveCount(0);
});
