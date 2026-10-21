import { createHash, timingSafeEqual } from "node:crypto";
import * as notificacoes from "@/lib/servicos/notificacoes";

// Chamado a cada 15 min pelo cron da Vercel (vercel.json), que manda
// "Authorization: Bearer <CRON_SECRET>" sozinho quando a variável existe no projeto.

export const maxDuration = 60;

function autorizado(cabecalho: string | null): boolean {
  const segredo = process.env.CRON_SECRET;
  // Sem segredo configurado, ninguém entra (nem com cabeçalho vazio).
  if (!segredo || !cabecalho) return false;
  // SHA-256 deixa os dois do mesmo tamanho (exigência do timingSafeEqual) e a comparação
  // leva o mesmo tempo acerte ou erre: o tempo de resposta não revela o segredo.
  const recebido = createHash("sha256").update(cabecalho).digest();
  const esperado = createHash("sha256").update(`Bearer ${segredo}`).digest();
  return timingSafeEqual(recebido, esperado);
}

export async function GET(request: Request) {
  if (!autorizado(request.headers.get("authorization"))) {
    return Response.json({ ok: false }, { status: 401 });
  }
  const enviadas = await notificacoes.enviar(20);
  return Response.json({ ok: true, enviadas });
}
