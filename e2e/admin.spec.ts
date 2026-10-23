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
