import { log } from "@/lib/logger";
import { segredoConfere } from "@/lib/segredo";
import { type AmbienteAsaas, registrarEventoAsaas } from "@/lib/servicos/asaas";
import { eventoAsaasSchema } from "@/lib/validacao/asaas";

// Webhook do Asaas (Integrações → Webhooks, envio sequencial). O Asaas manda o token
// configurado no cabeçalho asaas-access-token. Aqui só gravamos o evento e respondemos 200:
// o processamento (faturas, suspensão) é da Fase 1 e roda fora desta requisição.
// Depois de 15 respostas com erro seguidas, o Asaas interrompe a fila: só respondemos
// erro quando reenviar resolve (token errado ou banco fora do ar).
// O corpo do evento não diz o ambiente: cada ambiente do Asaas tem o seu token, e o token
// que bateu decide (ASAAS_WEBHOOK_TOKEN = produção, ASAAS_WEBHOOK_TOKEN_SANDBOX = sandbox).

export async function POST(request: Request) {
  const token = request.headers.get("asaas-access-token");
  const producao = segredoConfere(token, process.env.ASAAS_WEBHOOK_TOKEN);
  const sandbox = segredoConfere(token, process.env.ASAAS_WEBHOOK_TOKEN_SANDBOX);
  if (producao && sandbox) {
    // Os dois tokens iguais na Vercel: não dá para saber o ambiente, e evento de teste
    // tratado como real poderia gerar cobrança ou suspensão. Erro de configuração.
    log.erro("asaas_tokens_iguais");
    return Response.json({ ok: false }, { status: 500 });
  }
  if (!producao && !sandbox) {
    return Response.json({ ok: false }, { status: 401 });
  }
  const ambiente: AmbienteAsaas = producao ? "producao" : "sandbox";

  const corpo: unknown = await request.json().catch(() => null);
  const evento = eventoAsaasSchema.safeParse(corpo);
  if (!evento.success) {
    // Reenviar o mesmo corpo não o tornaria válido: registra só os nomes dos campos e segue.
    const campos = [...new Set(evento.error.issues.map((i) => i.path.join(".") || "corpo"))];
    log.aviso("asaas_evento_invalido", { codigo: `invalido:${campos.join(",")}` });
    return Response.json({ ok: true, ignorado: true });
  }

  try {
    const novo = await registrarEventoAsaas(evento.data, ambiente);
    log.info("asaas_evento", { codigo: `${ambiente}:${evento.data.event}${novo ? "" : ":repetido"}` });
    return Response.json({ ok: true });
  } catch (erro) {
    log.erro("asaas_evento_falhou", { codigo: erro instanceof Error ? erro.message : "desconhecido" });
    return Response.json({ ok: false }, { status: 500 });
  }
}
