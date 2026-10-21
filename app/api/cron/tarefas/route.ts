import { segredoConfere } from "@/lib/segredo";
import * as notificacoes from "@/lib/servicos/notificacoes";

// Chamado a cada 15 min pelo cron da Vercel (vercel.json), que manda
// "Authorization: Bearer <CRON_SECRET>" sozinho quando a variável existe no projeto.

export const maxDuration = 60;

export async function GET(request: Request) {
  const segredo = process.env.CRON_SECRET;
  if (!segredoConfere(request.headers.get("authorization"), segredo ? `Bearer ${segredo}` : undefined)) {
    return Response.json({ ok: false }, { status: 401 });
  }
  const enviadas = await notificacoes.enviar(20);
  return Response.json({ ok: true, enviadas });
}
