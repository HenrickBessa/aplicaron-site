"use server";

import { redirect } from "next/navigation";
import { log } from "@/lib/logger";
import { clienteServidor } from "@/lib/supabase/servidor";
import { codigoMfaSchema, entrarSchema } from "@/lib/validacao/admin";

// Server Action = endpoint público: qualquer um pode chamá-la sem passar pelo formulário.
// As mensagens de erro são genéricas de propósito (não dizem se o e-mail existe).
// Logs: só o código do erro, nunca e-mail, senha ou código digitado.

export type ResultadoAcao = { erro: string } | null;

export async function entrar(_anterior: ResultadoAcao, form: FormData): Promise<ResultadoAcao> {
  const dados = entrarSchema.safeParse({ email: form.get("email"), senha: form.get("senha") });
  if (!dados.success) return { erro: "E-mail ou senha incorretos." };

  const supabase = await clienteServidor();
  const { error } = await supabase.auth.signInWithPassword({ email: dados.data.email, password: dados.data.senha });
  if (error) {
    log.aviso("admin_login_falhou", { codigo: error.code ?? "sem_codigo" });
    return { erro: "E-mail ou senha incorretos." };
  }
  redirect("/admin/mfa");
}

export type CadastroMfa = { qr: string; segredo: string } | { erro: string } | null;

// Primeiro acesso: cria o fator TOTP e devolve o QR code para o app autenticador.
// Um cadastro anterior que não foi confirmado é apagado antes (senão o limite de fatores enche).
export async function iniciarCadastroMfa(): Promise<CadastroMfa> {
  const supabase = await clienteServidor();
  const { data: fatores, error: erroLista } = await supabase.auth.mfa.listFactors();
  if (erroLista) return { erro: "Sessão expirada. Entre de novo." };
  if (fatores.totp.length > 0) return { erro: "O app autenticador já está cadastrado. Digite o código." };

  for (const fator of fatores.all) {
    if (fator.factor_type === "totp" && fator.status === "unverified") {
      await supabase.auth.mfa.unenroll({ factorId: fator.id });
    }
  }

  const { data, error } = await supabase.auth.mfa.enroll({ factorType: "totp", friendlyName: "AplicarOn admin" });
  if (error) {
    log.erro("admin_mfa_cadastro_falhou", { codigo: error.code ?? "sem_codigo" });
    return { erro: "Não foi possível iniciar o cadastro. Tente de novo." };
  }
  return { qr: data.totp.qr_code, segredo: data.totp.secret };
}

// Confere o código. Vale tanto para confirmar o cadastro quanto para os logins seguintes.
// O fator vem da sessão, nunca do formulário.
export async function confirmarMfa(_anterior: ResultadoAcao, form: FormData): Promise<ResultadoAcao> {
  const dados = codigoMfaSchema.safeParse({ codigo: form.get("codigo") });
  if (!dados.success) return { erro: "Digite os 6 números do app autenticador." };

  const supabase = await clienteServidor();
  const { data: fatores, error: erroLista } = await supabase.auth.mfa.listFactors();
  if (erroLista) return { erro: "Sessão expirada. Entre de novo." };
  const fator =
    fatores.totp[0] ?? fatores.all.find((f) => f.factor_type === "totp" && f.status === "unverified");
  if (!fator) return { erro: "Cadastre o app autenticador primeiro." };

  const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId: fator.id, code: dados.data.codigo });
  if (error) {
    log.aviso("admin_mfa_falhou", { codigo: error.code ?? "sem_codigo" });
    return { erro: "Código inválido ou vencido. Confira o app e tente de novo." };
  }
  redirect("/admin");
}

export async function sair() {
  const supabase = await clienteServidor();
  await supabase.auth.signOut();
  redirect("/admin/entrar");
}
