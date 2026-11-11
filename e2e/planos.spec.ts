import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const WCAG = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

async function semViolacoes(page: Page) {
  const r = await new AxeBuilder({ page }).withTags(WCAG).analyze();
  expect(r.violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
}

// A tabela leads não tem grant para a chave secret: a conferência lê pelo psql do container local.
function lerLead(nome: string) {
  return execFileSync("docker", [
    "exec",
    "supabase_db_aplicaron",
    "psql",
    "-U",
    "postgres",
    "-tA",
    "-F",
    "|",
    "-c",
    `select plano_interesse, servico, addons, cidade, segmento, faixa_orcamento is null from public.leads where nome = '${nome}'`,
  ])
    .toString()
    .trim();
}

test("cartão do plano marca o plano no formulário; envio grava o lead e abre o WhatsApp com a mensagem", async ({ page }) => {
  // O WhatsApp de verdade não é aberto: o teste só confere para onde o navegador foi.
  await page.route("https://wa.me/**", (rota) => rota.fulfill({ body: "WhatsApp" }));
  await page.clock.install();
  await page.goto("/planos");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await semViolacoes(page);

  await page.getByRole("link", { name: "Quero este plano: Vende" }).click();
  await expect(page.getByRole("heading", { level: 2, name: "Quero este plano" })).toBeFocused();
  await expect(page.getByRole("radio", { name: /^Vende/ })).toBeChecked();

  const nome = `Plano E2E ${randomUUID().slice(0, 8)}`;
  await page.getByLabel(/^CRM/).check();
  await page.getByLabel("Nome", { exact: true }).fill(nome);
  await page.getByLabel("E-mail", { exact: true }).fill("plano-e2e@exemplo.com");
  await page.getByLabel(/^Empresa ou negócio/).fill("Clínica X");
  await page.getByLabel(/^Cidade/).fill("Rio Branco/AC");
  await page.getByLabel(/^Segmento/).fill("saúde");
  await page.getByLabel("O que você precisa").fill("Site com agendamento e catálogo de serviços.");
  await semViolacoes(page);

  await page.clock.fastForward(5_000);
  await page.getByRole("button", { name: "Enviar e abrir o WhatsApp" }).click();

  await expect(page).toHaveURL(/^https:\/\/wa\.me\/5547988800836\?text=/);
  const texto = new URL(page.url()).searchParams.get("text");
  expect(texto).toBe(
    "Olá, AplicarOn! Vim pelo site.\nPlano: Vende\nAdd-ons: CRM\n" +
      "Negócio: Clínica X — Rio Branco/AC — saúde\nPreciso de: Site com agendamento e catálogo de serviços.",
  );
  expect(lerLead(nome)).toBe("vende|sites|{crm}|Rio Branco/AC|saúde|t");
});

test("rodapé leva às regras de contratação em /planos", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("navigation", { name: "Rodapé" }).getByRole("link", { name: "Como funciona a contratação" }).click();
  await expect(page).toHaveURL(/\/planos#como-funciona$/);
  await expect(page.getByRole("heading", { level: 2, name: "Como funciona a contratação" })).toBeInViewport();
  await expect(page.getByText("50% da implantação na assinatura e 50% na entrega.", { exact: false })).toBeVisible();
});

test("sem plano e sem e-mail: resumo de erros focado, nada enviado", async ({ page }) => {
  await page.goto("/planos#contratar");
  await page.getByLabel("Nome", { exact: true }).fill("Alguém");
  await page.getByRole("button", { name: "Enviar e abrir o WhatsApp" }).click();
  const resumo = page.getByText(/Corrija \d campos para continuar/);
  await expect(resumo).toBeVisible();
  await expect(page.getByRole("link", { name: /^Plano:/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /^E-mail:/ })).toBeVisible();
  await expect(page).toHaveURL(/\/planos/);
  await semViolacoes(page);
});

test("AplicarAgro: em piloto, sem preço nem formulário, com lista de interesse pelo WhatsApp", async ({ page }) => {
  await page.goto("/produtos");
  await expect(page.getByRole("link", { name: /AplicarAgro/ })).toContainText("Em piloto");

  await page.goto("/produtos/aplicaragro");
  await expect(page.locator("#lista-de-interesse")).toContainText("O AplicarAgro está em piloto.");
  await expect(page.getByText("R$")).toHaveCount(0);
  await expect(page.locator("#contratar")).toHaveCount(0);
  const link = page.getByRole("link", { name: /Entrar na lista pelo WhatsApp/ });
  const href = new URL((await link.getAttribute("href"))!);
  expect(href.origin + href.pathname).toBe("https://wa.me/5547988800836");
  expect(href.searchParams.get("text")).toBe("Olá, AplicarOn! Vim pelo site e quero entrar na lista de interesse do AplicarAgro.");
  await semViolacoes(page);
});

test("página do Agenda + Cobrança: chamada principal, plano já marcado e links de /planos e de Sistemas", async ({ page }) => {
  await page.goto("/produtos/agenda-cobranca");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Pare de perder consulta por falta de lembrete e de correr atrás de atrasado.",
  );
  await expect(page.getByRole("radio", { name: /^Agenda \+ Cobrança/ })).toBeChecked();

  await page.goto("/planos");
  await page.getByRole("link", { name: "Conhecer o Agenda + Cobrança" }).click();
  await expect(page).toHaveURL(/\/produtos\/agenda-cobranca$/);

  await page.goto("/servicos/sistemas");
  await page.getByRole("link", { name: "Agenda + Cobrança" }).click();
  await expect(page).toHaveURL(/\/produtos\/agenda-cobranca$/);
});

test("home mostra os planos com link para o formulário com o plano marcado", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Quero este plano: Agenda + Cobrança" }).click();
  await expect(page).toHaveURL(/\/planos#quero-agenda_cobranca$/);
  await expect(page.getByRole("radio", { name: /^Agenda \+ Cobrança/ })).toBeChecked();
});
