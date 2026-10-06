import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { criarLead } from "@/lib/servicos/leads";
import { enviar } from "@/lib/servicos/notificacoes";
import { diagnosticoSchema } from "@/lib/validacao/diagnostico";

// Contra o Supabase local (npm run db:start). Só o Resend é simulado.

type Reivindicado = { id: string; tentativa: number };

// Cada worker com o seu próprio cliente = suas próprias requisições HTTP em paralelo,
// atendidas por conexões diferentes do PostgREST ao Postgres.
function novoWorker() {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!, {
    auth: { persistSession: false },
  }).schema("sistema");
}

async function novoLead(servico = "sites") {
  const dados = diagnosticoSchema.parse({
    submission_id: randomUUID(),
    servico,
    faixa_orcamento: "nao_sei",
    descricao: "Lead do teste de notificações.",
    nome: "Teste Notificação",
    email: "notificacao@ex.com",
  });
  const { leadId } = await criarLead({ ...dados, politica_versao: "2026-10-05" });
  return leadId;
}

// Esvazia a fila de leads deixados por outros testes, para os números abaixo serem exatos.
async function drenarFila() {
  const w = novoWorker();
  for (;;) {
    const { data } = await w.rpc("reivindicar_notificacoes", { p_limite: 100 });
    if (!data?.length) return;
    for (const l of data as Reivindicado[]) {
      await w.rpc("concluir_notificacao", { p_id: l.id, p_tentativa: l.tentativa, p_ok: true });
    }
  }
}

describe("fila de notificação (Supabase local)", () => {
  beforeAll(drenarFila);

  it("reivindicações simultâneas devolvem conjuntos disjuntos", async () => {
    const criados = await Promise.all(Array.from({ length: 30 }, () => novoLead()));

    // 10 workers ao mesmo tempo, 5 por vez cada: há mais pedidos (50) do que leads (30).
    const respostas = await Promise.all(
      Array.from({ length: 10 }, () => novoWorker().rpc("reivindicar_notificacoes", { p_limite: 5 })),
    );
    for (const r of respostas) expect(r.error).toBeNull();

    const ids = respostas.flatMap((r) => (r.data as Reivindicado[]).map((l) => l.id));
    // Nenhum lead foi entregue a dois workers...
    expect(new Set(ids).size).toBe(ids.length);
    // ...e nenhum ficou de fora.
    expect(new Set(ids)).toEqual(new Set(criados));
  });

  describe("enviar() de ponta a ponta", () => {
    const fetchReal = globalThis.fetch;
    let respostaResend: () => Promise<Response>;

    beforeAll(() => {
      process.env.RESEND_API_KEY = "re_teste";
      process.env.NOTIFICACAO_EMAIL_DE = "AplicarOn <avisos@exemplo.com>";
      process.env.NOTIFICACAO_EMAIL_PARA = "time@exemplo.com";
      process.env.NEXT_PUBLIC_SITE_URL = "https://aplicar-on.vercel.app";
      vi.spyOn(console, "error").mockImplementation(() => {});
      // Só as chamadas ao Resend são interceptadas; o Supabase usa o fetch de verdade.
      vi.stubGlobal("fetch", (url: RequestInfo | URL, init?: RequestInit) =>
        String(url).startsWith("https://api.resend.com/") ? respostaResend() : fetchReal(url, init),
      );
    });
    afterEach(drenarFila);

    it("sucesso: marca como enviada e não reenvia", async () => {
      respostaResend = async () => new Response("{}", { status: 200 });
      const id = await novoLead("aplicativos");
      expect(await enviar(1, id)).toBe(1);
      // Já enviada: não volta para a fila.
      const { data } = await novoWorker().rpc("reivindicar_notificacoes", { p_limite: 1, p_lead_id: id });
      expect(data).toEqual([]);
    });

    it("falha: agenda nova tentativa para depois (backoff), não para agora", async () => {
      respostaResend = async () => new Response("{}", { status: 500 });
      const id = await novoLead("sistemas");
      expect(await enviar(1, id)).toBe(0);
      // Reagendada para daqui a 5 min: uma nova rodada agora não a pega.
      expect(await enviar(1, id)).toBe(0);
      const { data } = await novoWorker().rpc("reivindicar_notificacoes", { p_limite: 1, p_lead_id: id });
      expect(data).toEqual([]);
    });
  });
});
