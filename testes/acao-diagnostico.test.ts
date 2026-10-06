import { beforeEach, describe, expect, it, vi } from "vitest";

// A Action é testada isolada: banco e after() são simulados.
const criarLead = vi.fn();
const after = vi.fn();
vi.mock("@/lib/servicos/leads", () => ({ criarLead: (...a: unknown[]) => criarLead(...a) }));
vi.mock("next/server", () => ({ after: (...a: unknown[]) => after(...a) }));
vi.mock("next/headers", () => ({ headers: async () => new Headers({ "x-vercel-id": "gru1::teste" }) }));
vi.mock("@sentry/nextjs", () => ({ captureMessage: vi.fn() }));

const { enviarDiagnostico } = await import("@/app/(site)/diagnostico/acoes");
const { VERSAO_POLITICA_VIGENTE } = await import("@/conteudo/privacidade");

const PESSOAL = { nome: "Ana Souza", email: "ana@empresa.com.br", whatsapp: "(47) 98880-0836", empresa: "ACME" };

const valido = {
  submission_id: "3f2b1c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d",
  servico: "sites",
  faixa_orcamento: "5k_15k",
  descricao: "Quero um site institucional novo.",
  ...PESSOAL,
  marketing_optin: false,
  tempo_preenchimento_ms: 45_000,
  site: "",
};

// redirect() do Next lança um erro especial com o destino no `digest`.
const redirecionaParaObrigado = { digest: expect.stringContaining(";/obrigado;") };

let logs: string[];
beforeEach(() => {
  criarLead.mockReset();
  after.mockReset();
  logs = [];
  for (const metodo of ["log", "warn", "error"] as const) {
    vi.spyOn(console, metodo).mockImplementation((...a) => void logs.push(a.join(" ")));
  }
});

describe("enviarDiagnostico", () => {
  it("honeypot preenchido: sucesso falso, nada gravado", async () => {
    await expect(enviarDiagnostico({ ...valido, site: "http://spam" })).rejects.toMatchObject(redirecionaParaObrigado);
    expect(criarLead).not.toHaveBeenCalled();
  });

  it("enviado em menos de 3 s: sucesso falso, nada gravado", async () => {
    await expect(enviarDiagnostico({ ...valido, tempo_preenchimento_ms: 1200 })).rejects.toMatchObject(redirecionaParaObrigado);
    expect(criarLead).not.toHaveBeenCalled();
  });

  it("sem tempo de preenchimento (chamada direta à Action): sucesso falso", async () => {
    const semTempo: Partial<typeof valido> = { ...valido };
    delete semTempo.tempo_preenchimento_ms;
    await expect(enviarDiagnostico(semTempo)).rejects.toMatchObject(redirecionaParaObrigado);
    expect(criarLead).not.toHaveBeenCalled();
  });

  it("entrada que nem é objeto não quebra a Action", async () => {
    await expect(enviarDiagnostico("lixo")).rejects.toMatchObject(redirecionaParaObrigado);
    expect(criarLead).not.toHaveBeenCalled();
  });

  it("dados inválidos: devolve erros por campo e loga só os NOMES dos campos", async () => {
    const r = await enviarDiagnostico({ ...valido, email: "ana-sem-arroba", nome: "A" });
    expect(r).toEqual({ ok: false, erros: { email: expect.any(String), nome: expect.any(String) } });
    expect(criarLead).not.toHaveBeenCalled();
    expect(logs.join("\n")).toContain('"codigo":"invalido:nome,email"');
    expect(logs.join("\n")).toContain('"request_id":"gru1::teste"');
    expect(logs.join("\n")).not.toContain("ana-sem-arroba");
  });

  it("submission_id adulterado: mensagem genérica, sem expor o campo interno", async () => {
    const r = await enviarDiagnostico({ ...valido, submission_id: "nao-e-uuid" });
    expect(r).toEqual({ ok: false, erroGeral: "indisponivel" });
  });

  it("lead novo: grava normalizado com a versão da política do servidor, agenda notificação e redireciona", async () => {
    criarLead.mockResolvedValue({ criado: true, leadId: "lead-1" });
    await expect(enviarDiagnostico({ ...valido, politica_versao: "forjada" })).rejects.toMatchObject(redirecionaParaObrigado);

    expect(criarLead).toHaveBeenCalledWith(
      expect.objectContaining({ whatsapp: "+5547988800836", politica_versao: VERSAO_POLITICA_VIGENTE }),
    );
    expect(after).toHaveBeenCalledOnce();
  });

  it("reenvio (criado = false): não agenda outra notificação, mas mostra sucesso", async () => {
    criarLead.mockResolvedValue({ criado: false, leadId: "lead-1" });
    await expect(enviarDiagnostico(valido)).rejects.toMatchObject(redirecionaParaObrigado);
    expect(after).not.toHaveBeenCalled();
  });

  it("falha no banco: erro geral, sem dados do lead no log nem na resposta", async () => {
    criarLead.mockRejectedValue(new Error("criar_lead falhou: 57014"));
    const r = await enviarDiagnostico(valido);
    expect(r).toEqual({ ok: false, erroGeral: "indisponivel" });
    const tudo = logs.join("\n") + JSON.stringify(r);
    for (const valor of [...Object.values(PESSOAL), "+5547988800836"]) expect(tudo).not.toContain(valor);
  });
});
