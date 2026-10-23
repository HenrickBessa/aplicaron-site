import { randomUUID } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { criarLead } from "@/lib/servicos/leads";
import { diagnosticoSchema } from "@/lib/validacao/diagnostico";
import { criarAdminTeste } from "../apoio/admin";
import { codigoTotp } from "../apoio/totp";

// As Actions e o DAL do CRM de verdade, contra o Supabase local. Só a origem da sessão é
// trocada: em vez dos cookies do Next, um cliente supabase-js já logado (aal1 ou aal2).
let sessao: SupabaseClient;
vi.mock("@/lib/supabase/servidor", () => ({ clienteServidor: async () => sessao }));
vi.mock("next/cache", () => ({ refresh: vi.fn() }));

const { adicionarNota, mudarStatus } = await import("@/app/admin/leads/[id]/acoes");
const { buscarLead, listarLeads } = await import("@/lib/dal/leads");

const paraMfa = { digest: expect.stringContaining(";/admin/mfa;") };

function clientePublico() {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function formulario(campos: Record<string, string | number>) {
  const form = new FormData();
  for (const [nome, valor] of Object.entries(campos)) form.set(nome, String(valor));
  return form;
}

async function novoLead(campos: { nome?: string; email?: string; empresa?: string; servico?: string } = {}) {
  const dados = diagnosticoSchema.parse({
    submission_id: randomUUID(),
    servico: "sistemas",
    faixa_orcamento: "15k_50k",
    descricao: "Lead para o teste do CRM.",
    nome: "Lead CRM Teste",
    email: "lead-crm@ex.com",
    marketing_optin: false,
    ...campos,
  });
  return (await criarLead({ ...dados, politica_versao: "2026-10-05" })).leadId;
}

let aal1: SupabaseClient;
let aal2: SupabaseClient;

beforeAll(async () => {
  const admin = await criarAdminTeste();
  aal2 = clientePublico();
  await aal2.auth.signInWithPassword({ email: admin.email, password: admin.senha });
  const { data: fator } = await aal2.auth.mfa.enroll({ factorType: "totp" });
  const { error } = await aal2.auth.mfa.challengeAndVerify({ factorId: fator!.id, code: codigoTotp(fator!.totp.secret) });
  expect(error).toBeNull();

  aal1 = clientePublico();
  await aal1.auth.signInWithPassword({ email: admin.email, password: admin.senha });
});

describe("CRM: mudar status", () => {
  it("admin com MFA muda o status; o banco grava o histórico e a versão", async () => {
    sessao = aal2;
    const id = await novoLead();
    const antes = (await buscarLead(id))!;
    expect(antes.status).toBe("novo");

    const r = await mudarStatus(null, formulario({ lead_id: id, status: "em_contato", versao: antes.versao }));
    expect(r).toEqual({ ok: "Status salvo." });

    const depois = (await buscarLead(id))!;
    expect(depois.status).toBe("em_contato");
    expect(depois.versao).toBe(antes.versao + 1);
    expect(depois.lead_status_historico).toMatchObject([{ status_anterior: "novo", status_novo: "em_contato" }]);
  });

  it("versão antiga (outra aba mudou antes): não altera nada", async () => {
    sessao = aal2;
    const id = await novoLead();
    await mudarStatus(null, formulario({ lead_id: id, status: "em_contato", versao: 1 }));

    const r = await mudarStatus(null, formulario({ lead_id: id, status: "perdido", versao: 1 }));
    expect(r).toMatchObject({ erro: expect.stringContaining("Recarregue") });
    expect((await buscarLead(id))!.status).toBe("em_contato");
  });

  it("status fora da lista ou lead_id inválido: recusado antes do banco", async () => {
    sessao = aal2;
    const id = await novoLead();
    expect(await mudarStatus(null, formulario({ lead_id: id, status: "ganho", versao: 1 }))).toHaveProperty("erro");
    expect(await mudarStatus(null, formulario({ lead_id: "1 or 1=1", status: "fechado", versao: 1 }))).toHaveProperty("erro");
    expect((await buscarLead(id))!.status).toBe("novo");
  });

  it("só com a senha (aal1): a Action manda para o MFA e o banco não deixa ler nem alterar", async () => {
    sessao = aal2;
    const id = await novoLead();

    sessao = aal1;
    await expect(mudarStatus(null, formulario({ lead_id: id, status: "fechado", versao: 1 }))).rejects.toMatchObject(paraMfa);
    await expect(buscarLead(id)).rejects.toMatchObject(paraMfa);
    // Mesmo pulando o exigirAdmin(), o RLS barra.
    const { data } = await aal1.from("leads").update({ status: "fechado" }).eq("id", id).select("id");
    expect(data).toEqual([]);

    sessao = aal2;
    expect((await buscarLead(id))!.status).toBe("novo");
  });
});

describe("CRM: notas", () => {
  it("admin com MFA adiciona notas; a mais nova aparece primeiro", async () => {
    sessao = aal2;
    const id = await novoLead();
    expect(await adicionarNota(null, formulario({ lead_id: id, texto: "  Liguei, pediu proposta.  " }))).toEqual({ ok: "Nota salva." });
    expect(await adicionarNota(null, formulario({ lead_id: id, texto: "Proposta enviada." }))).toEqual({ ok: "Nota salva." });
    expect((await buscarLead(id))!.lead_notas.map((n) => n.texto)).toEqual(["Proposta enviada.", "Liguei, pediu proposta."]);
  });

  it("vazia, longa demais ou lead inexistente: erro e o texto digitado volta", async () => {
    sessao = aal2;
    const id = await novoLead();
    expect(await adicionarNota(null, formulario({ lead_id: id, texto: "   " }))).toMatchObject({ erro: expect.any(String) });
    const longa = "x".repeat(5001);
    expect(await adicionarNota(null, formulario({ lead_id: id, texto: longa }))).toMatchObject({ texto: longa });
    expect(await adicionarNota(null, formulario({ lead_id: randomUUID(), texto: "Nota perdida" }))).toMatchObject({
      erro: expect.any(String),
      texto: "Nota perdida",
    });
    expect((await buscarLead(id))!.lead_notas).toEqual([]);
  });

  it("só com a senha (aal1): a Action manda para o MFA e o banco não deixa ler nem gravar", async () => {
    sessao = aal2;
    const id = await novoLead();
    await adicionarNota(null, formulario({ lead_id: id, texto: "Nota do admin" }));

    sessao = aal1;
    await expect(adicionarNota(null, formulario({ lead_id: id, texto: "Intrusa" }))).rejects.toMatchObject(paraMfa);
    const { data: notas } = await aal1.from("lead_notas").select("id").eq("lead_id", id);
    expect(notas).toEqual([]);
    const { error } = await aal1.from("lead_notas").insert({ lead_id: id, texto: "Intrusa" });
    expect(error?.code).toBe("42501");

    sessao = aal2;
    expect((await buscarLead(id))!.lead_notas.map((n) => n.texto)).toEqual(["Nota do admin"]);
  });
});

describe("CRM: lista com busca, filtros e páginas", () => {
  // O banco local é compartilhado com outros testes: cada caso usa uma marca única na busca.
  it("busca por nome, e-mail ou empresa, com filtros e total", async () => {
    sessao = aal2;
    const marca = `m${randomUUID().slice(0, 8)}`;
    const ana = await novoLead({ nome: `Ana ${marca}`, servico: "sites" });
    await novoLead({ nome: "Bruno", email: `bruno.${marca}@ex.com`, servico: "sistemas" });
    await novoLead({ nome: "Carla", empresa: `Padaria ${marca.toUpperCase()}`, servico: "sites" });
    await mudarStatus(null, formulario({ lead_id: ana, status: "fechado", versao: 1 }));

    const todos = await listarLeads({ busca: marca, pagina: 1 });
    expect(todos.total).toBe(3);
    expect(todos.leads.map((l) => l.nome).sort()).toEqual([`Ana ${marca}`, "Bruno", "Carla"]);

    expect((await listarLeads({ busca: marca, servico: "sites", pagina: 1 })).leads.map((l) => l.nome).sort()).toEqual([
      `Ana ${marca}`,
      "Carla",
    ]);
    expect(await listarLeads({ busca: marca, status: "fechado", pagina: 1 })).toMatchObject({ total: 1, leads: [{ id: ana }] });
    expect(await listarLeads({ busca: marca, plano: "vende", pagina: 1 })).toEqual({ leads: [], total: 0 });
  });

  it("texto com a sintaxe de filtro do PostgREST é só texto", async () => {
    sessao = aal2;
    expect(await listarLeads({ busca: "x,status.eq.novo),or(nome.ilike.*", pagina: 1 })).toEqual({ leads: [], total: 0 });
  });

  it("20 por página, do mais recente ao mais antigo; página depois da última vem vazia", async () => {
    sessao = aal2;
    const marca = `p${randomUUID().slice(0, 8)}`;
    for (let i = 0; i < 21; i++) await novoLead({ nome: `Lead ${marca} ${String(i).padStart(2, "0")}` });

    const p1 = await listarLeads({ busca: marca, pagina: 1 });
    const p2 = await listarLeads({ busca: marca, pagina: 2 });
    expect(p1.total).toBe(21);
    expect(p1.leads).toHaveLength(20);
    expect(p1.leads[0].nome).toBe(`Lead ${marca} 20`);
    expect(p2.leads.map((l) => l.nome)).toEqual([`Lead ${marca} 00`]);
    expect((await listarLeads({ busca: marca, pagina: 3 })).leads).toEqual([]);
  });

  it("só com a senha (aal1): manda para o MFA e o banco não devolve nada", async () => {
    sessao = aal1;
    await expect(listarLeads({ pagina: 1 })).rejects.toMatchObject(paraMfa);
    const { data } = await aal1.rpc("listar_leads", { p_busca: null }).select("id");
    expect(data).toEqual([]);
  });
});
