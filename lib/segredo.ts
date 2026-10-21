import { createHash, timingSafeEqual } from "node:crypto";

// Compara o segredo recebido (cabeçalho) com o esperado (variável de ambiente).
// Sem segredo configurado, ninguém entra (nem com cabeçalho vazio).
// SHA-256 deixa os dois do mesmo tamanho (exigência do timingSafeEqual) e a comparação
// leva o mesmo tempo acerte ou erre: o tempo de resposta não revela o segredo.
export function segredoConfere(recebido: string | null, esperado: string | undefined): boolean {
  if (!esperado || !recebido) return false;
  const a = createHash("sha256").update(recebido).digest();
  const b = createHash("sha256").update(esperado).digest();
  return timingSafeEqual(a, b);
}
