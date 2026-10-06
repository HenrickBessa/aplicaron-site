import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Banco simulado: uma fila em memória que imita reivindicar/concluir.
type Lead = { id: string; tentativa: number; servico: string; faixa_orcamento: string };
let fila: Lead[];
const concluidas: Record<string, unknown>[] = [];
const rpc = vi.fn(async (nome: string, args: Record<string, unknown>) => {
  if (nome === "reivindicar_notificacoes") {
    const i = fila.findIndex((l) => !args.p_lead_id || l.id === args.p_lead_id);
    if (i < 0) return { data: [], error: null };
    const [lead] = fila.splice(i, 1);
    return { data: [lead], error: null };
  }
  concluidas.push(args);
  return { data: true, error: null };
});
vi.mock("@/lib/supabase/sistema", () => ({ clienteSistema: () => ({ schema: () => ({ rpc }) }) }));

const { enviar, montarEmail } = await import("@/lib/servicos/notificacoes");

const fetchFalso = vi.fn();

beforeEach(() => {
  fila = [
    { id: "lead-a", tentativa: 1, servico: "sites", faixa_orcamento: "5k_15k" },
    { id: "lead-b", tentativa: 3, servico: "automacao_ia", faixa_orcamento: "nao_sei" },
  ];
  concluidas.length = 0;
  rpc.mockClear();
  fetchFalso.mockReset().mockResolvedValue(new Response("{}", { status: 200 }));
  vi.stubGlobal("fetch", fetchFalso);
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.stubEnv("RESEND_API_KEY", "re_teste");
  vi.stubEnv("NOTIFICACAO_EMAIL_DE", "AplicarOn <avisos@exemplo.com>");
  vi.stubEnv("NOTIFICACAO_EMAIL_PARA", "time@exemplo.com");
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://aplicar-on.vercel.app/");
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("montarEmail", () => {
  it("assunto e corpo só com serviço, faixa e link do admin", () => {
    const email = montarEmail({ id: "abc", servico: "sites", faixa_orcamento: "5k_15k" }, "https://aplicar-on.vercel.app/");
    expect(email.subject).toBe("Novo diagnóstico: Sites, R$ 5 mil a R$ 15 mil");
    expect(email.text).toContain("https://aplicar-on.vercel.app/admin/leads/abc");
    expect(email.html).toContain('href="https://aplicar-on.vercel.app/admin/leads/abc"');
  });
});

describe("enviar", () => {
  it("sem configuração do Resend não reivindica nada (não queima tentativas)", async () => {
    vi.stubEnv("RESEND_API_KEY", "");
    expect(await enviar(20)).toBe(0);
    expect(rpc).not.toHaveBeenCalled();
  });

  it("processa a fila um por vez até esvaziar e conclui cada tentativa com sucesso", async () => {
    expect(await enviar(20)).toBe(2);
    expect(fetchFalso).toHaveBeenCalledTimes(2);
    expect(concluidas).toEqual([
      { p_id: "lead-a", p_tentativa: 1, p_ok: true, p_codigo: null },
      { p_id: "lead-b", p_tentativa: 3, p_ok: true, p_codigo: null },
    ]);
    // Reivindica sempre 1 por vez (cada trava de 2 min cobre só o próprio envio).
    expect(rpc).toHaveBeenCalledWith("reivindicar_notificacoes", { p_limite: 1, p_lead_id: null });
  });

  it("chama o Resend com chave de idempotência por lead e sem dados pessoais", async () => {
    await enviar(1);
    const [url, init] = fetchFalso.mock.calls[0];
    expect(url).toBe("https://api.resend.com/emails");
    expect(init.headers["Idempotency-Key"]).toBe("lead-lead-a");
    expect(init.headers.Authorization).toBe("Bearer re_teste");
    const corpo = JSON.parse(init.body);
    expect(corpo).toMatchObject({ from: "AplicarOn <avisos@exemplo.com>", to: ["time@exemplo.com"] });
    expect(Object.keys(corpo).sort()).toEqual(["from", "html", "subject", "text", "to"]);
  });

  it("respeita o limite", async () => {
    expect(await enviar(1)).toBe(1);
    expect(fila).toHaveLength(1);
  });

  it("com leadId, processa só aquele lead", async () => {
    expect(await enviar(1, "lead-b")).toBe(1);
    expect(rpc).toHaveBeenCalledWith("reivindicar_notificacoes", { p_limite: 1, p_lead_id: "lead-b" });
    expect(concluidas[0]).toMatchObject({ p_id: "lead-b" });
  });

  it("erro HTTP do Resend: conclui com falha e o código http_<status>", async () => {
    fetchFalso.mockResolvedValue(new Response("{}", { status: 503 }));
    expect(await enviar(1)).toBe(0);
    expect(concluidas[0]).toEqual({ p_id: "lead-a", p_tentativa: 1, p_ok: false, p_codigo: "http_503" });
  });

  it("timeout de 10 s: conclui com falha e o código timeout", async () => {
    fetchFalso.mockRejectedValue(Object.assign(new Error("tempo esgotado"), { name: "TimeoutError" }));
    await enviar(1);
    expect(concluidas[0]).toMatchObject({ p_ok: false, p_codigo: "timeout" });
  });

  it("falha de rede: conclui com falha e o código rede", async () => {
    fetchFalso.mockRejectedValue(new TypeError("fetch failed"));
    await enviar(1);
    expect(concluidas[0]).toMatchObject({ p_ok: false, p_codigo: "rede" });
  });
});
