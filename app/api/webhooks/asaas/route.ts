import { log } from "@/lib/logger";
import { segredoConfere } from "@/lib/segredo";
import { registrarEventoAsaas } from "@/lib/servicos/asaas";
import { eventoAsaasSchema } from "@/lib/validacao/asaas";

// Webhook do Asaas (Integrações → Webhooks, envio sequencial). O Asaas manda o token
// configurado no cabeçalho asaas-access-token. Aqui só gravamos o evento e respondemos 200:
// o processamento (faturas, suspensão) é da Fase 1 e roda fora desta requisição.
// Depois de 15 respostas com erro seguidas, o Asaas interrompe a fila: só respondemos
// erro quando reenviar resolve (token errado ou banco fora do ar).

export async function POST(request: Request) {
  if (!segredoConfere(request.headers.get("asaas-access-token"), process.env.ASAAS_WEBHOOK_TOKEN)) {
    return Response.json({ ok: false }, { status: 401 });
  }

  const corpo: unknown = await request.json().catch(() => null);
  const evento = eventoAsaasSchema.safeParse(corpo);
  if (!evento.success) {
    // Reenviar o mesmo corpo não o tornaria válido: registra só os nomes dos campos e segue.
    const campos = [...new Set(evento.error.issues.map((i) => i.path.join(".") || "corpo"))];
    log.aviso("asaas_evento_invalido", { codigo: `invalido:${campos.join(",")}` });
    return Response.json({ ok: true, ignorado: true });
  }

  try {
    const novo = await registrarEventoAsaas(evento.data);
    log.info("asaas_evento", { codigo: novo ? evento.data.event : `${evento.data.event}:repetido` });
    return Response.json({ ok: true });
  } catch (erro) {
    log.erro("asaas_evento_falhou", { codigo: erro instanceof Error ? erro.message : "desconhecido" });
    return Response.json({ ok: false }, { status: 500 });
  }
}
