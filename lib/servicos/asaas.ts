import "server-only";
import { clienteSistema } from "@/lib/supabase/sistema";
import type { EventoAsaas } from "@/lib/validacao/asaas";

const TIMEOUT_MS = 8_000;

// Grava um evento do webhook pela função sistema.registrar_evento_asaas (idempotente pelo id).
// Devolve true se gravou e false se o evento já tinha chegado antes.
// Lança erro em falha ou timeout: a rota responde 500 e o Asaas reenvia.
export async function registrarEventoAsaas(evento: EventoAsaas): Promise<boolean> {
  const { data, error } = await clienteSistema()
    .schema("sistema")
    .rpc("registrar_evento_asaas", {
      p_evento_id: evento.id,
      p_tipo: evento.event,
      p_cobranca_id: evento.payment.id,
    })
    .abortSignal(AbortSignal.timeout(TIMEOUT_MS));

  if (error) throw new Error(`registrar_evento_asaas falhou: ${error.code ?? "sem_codigo"}`);
  return data === true;
}
