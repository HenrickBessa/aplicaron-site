import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { beforeAll, describe, expect, it } from "vitest";
import { criarLead } from "@/lib/servicos/leads";
import { diagnosticoSchema } from "@/lib/validacao/diagnostico";
import { criarAdminTeste } from "../apoio/admin";
import { codigoTotp } from "../apoio/totp";

// Login + MFA de verdade no Supabase Auth local, como o /admin faz.
// Os testes pgTAP simulam o token; aqui o token sai do próprio Auth.

function clientePublico() {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

let admin: Awaited<ReturnType<typeof criarAdminTeste>>;
let segredo = "";

beforeAll(async () => {
  admin = await criarAdminTeste();
  const lead = diagnosticoSchema.parse({
    submission_id: randomUUID(),
    servico: "sites",
    faixa_orcamento: "5k_15k",
    descricao: "Lead para o teste do admin.",
    nome: "Lead Admin Teste",
    email: "lead-admin@ex.com",
    marketing_optin: false,
  });
  await criarLead({ ...lead, politica_versao: "2026-10-05" });
});

describe("admin: login + MFA (Supabase local)", () => {
  // Usuário só nasce pelo painel/API admin. Cadastro aberto + MFA no primeiro acesso = qualquer um vira aal2.
  it("cadastro público está desligado", async () => {
    const { error } = await clientePublico().auth.signUp({ email: `intruso-${randomUUID()}@teste.local`, password: `Senha-${randomUUID()}` });
    expect(error).not.toBeNull();
  });

  it("só com a senha (aal1) o admin não vê nenhum lead", async () => {
    const supabase = clientePublico();
    const { error } = await supabase.auth.signInWithPassword({ email: admin.email, password: admin.senha });
    expect(error).toBeNull();
    const { data } = await supabase.from("leads").select("id");
    expect(data).toEqual([]);
  });

  it("com o código do app autenticador (aal2) o admin vê os leads", async () => {
    const supabase = clientePublico();
    await supabase.auth.signInWithPassword({ email: admin.email, password: admin.senha });
    const { data: fator, error } = await supabase.auth.mfa.enroll({ factorType: "totp" });
    expect(error).toBeNull();
    segredo = fator!.totp.secret;

    const verificado = await supabase.auth.mfa.challengeAndVerify({ factorId: fator!.id, code: codigoTotp(segredo) });
    expect(verificado.error).toBeNull();

    const { data } = await supabase.from("leads").select("nome");
    expect(data?.map((l) => l.nome)).toContain("Lead Admin Teste");
  });

  it("código errado não promove a sessão", async () => {
    const supabase = clientePublico();
    await supabase.auth.signInWithPassword({ email: admin.email, password: admin.senha });
    const { data: fatores } = await supabase.auth.mfa.listFactors();
    const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId: fatores!.totp[0].id, code: "000000" });
    expect(error).not.toBeNull();
    const { data } = await supabase.from("leads").select("id");
    expect(data).toEqual([]);
  });

  // Quem descobrir só a senha não pode cadastrar o próprio app autenticador e virar aal2.
  it("com fator já cadastrado, uma sessão só com senha não cadastra outro fator", async () => {
    const supabase = clientePublico();
    await supabase.auth.signInWithPassword({ email: admin.email, password: admin.senha });
    const { error } = await supabase.auth.mfa.enroll({ factorType: "totp", friendlyName: "intruso" });
    expect(error).not.toBeNull();
  });
});
