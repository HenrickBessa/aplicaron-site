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

const { mudarStatus } = await import("@/app/admin/leads/[id]/acoes");
const { buscarLead } = await import("@/lib/dal/leads");

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

async function novoLead() {
  const dados = diagnosticoSchema.parse({
    submission_id: randomUUID(),
    servico: "sistemas",
    faixa_orcamento: "15k_50k",
    descricao: "Lead para o teste do CRM.",
    nome: "Lead CRM Teste",
    email: "lead-crm@ex.com",
    marketing_optin: false,
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
