import "server-only";

// Envio do e-mail interno de "novo diagnóstico". Implementado na fatia 5
// (reivindicar_notificacoes -> Resend -> concluir_notificacao).
// Já existe agora para a Action do diagnóstico chamar via after().
export async function enviar(limite: number, leadId?: string): Promise<number> {
  void limite;
  void leadId;
  return 0;
}
