import { describe, expect, it } from "vitest";
import { DURACAO_SESSAO_MS, estadoSessao } from "@/lib/dal/admin";
import { codigoMfaSchema, entrarSchema } from "@/lib/validacao/admin";
import { codigoTotp } from "./apoio/totp";

const agora = Date.UTC(2026, 9, 22, 18, 0, 0);
const login = (msAtras: number) => Math.floor((agora - msAtras) / 1000);

describe("estadoSessao", () => {
  it("sem token: sem_sessao", () => {
    expect(estadoSessao(null, agora)).toBe("sem_sessao");
  });

  it("só senha (aal1): precisa_mfa", () => {
    expect(estadoSessao({ aal: "aal1", amr: [{ method: "password", timestamp: login(60_000) }] }, agora)).toBe("precisa_mfa");
  });

  it("senha + código (aal2), login recente: ok", () => {
    const amr = [
      { method: "totp", timestamp: login(30_000) },
      { method: "password", timestamp: login(60_000) },
    ];
    expect(estadoSessao({ aal: "aal2", amr }, agora)).toBe("ok");
  });

  it("login há mais de 8 h: expirada, mesmo com aal2 e código recente", () => {
    const amr = [
      { method: "totp", timestamp: login(60_000) },
      { method: "password", timestamp: login(DURACAO_SESSAO_MS + 1_000) },
    ];
    expect(estadoSessao({ aal: "aal2", amr }, agora)).toBe("expirada");
  });

  it("token sem amr (ou num formato estranho): expirada, nunca ok", () => {
    expect(estadoSessao({ aal: "aal2" }, agora)).toBe("expirada");
    expect(estadoSessao({ aal: "aal2", amr: ["password"] }, agora)).toBe("expirada");
  });
});

describe("validação do admin", () => {
  it("e-mail normalizado; senha vazia recusada", () => {
    expect(entrarSchema.parse({ email: " Admin@Ex.com ", senha: "x" }).email).toBe("admin@ex.com");
    expect(entrarSchema.safeParse({ email: "admin@ex.com", senha: "" }).success).toBe(false);
  });

  it("código: 6 dígitos, espaço tolerado, nada além disso", () => {
    expect(codigoMfaSchema.parse({ codigo: "123 456" }).codigo).toBe("123456");
    expect(codigoMfaSchema.safeParse({ codigo: "12345" }).success).toBe(false);
    expect(codigoMfaSchema.safeParse({ codigo: "12345a" }).success).toBe(false);
    expect(codigoMfaSchema.safeParse({ codigo: null }).success).toBe(false);
  });
});

describe("codigoTotp (apoio dos testes)", () => {
  // Vetor oficial da RFC 6238 (segredo "12345678901234567890" em base32, T = 59 s).
  it("bate com a RFC 6238", () => {
    expect(codigoTotp("GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ", 59_000)).toBe("287082");
  });
});
