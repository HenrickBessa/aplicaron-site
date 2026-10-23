import { createHmac } from "node:crypto";

// Gera o código de 6 dígitos que um app autenticador mostraria (TOTP, RFC 6238: SHA-1, 30 s).
// Só para os testes: em uso real quem gera é o app no celular do admin.
export function codigoTotp(segredoBase32: string, agoraMs = Date.now()): string {
  const alfabeto = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = "";
  for (const letra of segredoBase32.replace(/=+$/, "").toUpperCase()) {
    const valor = alfabeto.indexOf(letra);
    if (valor < 0) throw new Error("segredo TOTP inválido");
    bits += valor.toString(2).padStart(5, "0");
  }
  const chave = Buffer.from(bits.match(/.{8}/g)!.map((b) => parseInt(b, 2)));

  const contador = Buffer.alloc(8);
  contador.writeBigUInt64BE(BigInt(Math.floor(agoraMs / 30_000)));
  const hmac = createHmac("sha1", chave).update(contador).digest();
  const inicio = hmac[hmac.length - 1] & 0x0f;
  const numero = (hmac.readUInt32BE(inicio) & 0x7fffffff) % 1_000_000;
  return numero.toString().padStart(6, "0");
}
