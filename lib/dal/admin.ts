import "server-only";
import { redirect } from "next/navigation";
import { cache } from "react";
import { clienteServidor } from "@/lib/supabase/servidor";

// Uma sessão do admin dura no máximo 8 h a partir do login. Depois disso pede senha e
// código de novo. O cookie da biblioteca dura 400 dias e não dá para encurtar, por isso o
// limite é conferido aqui, pela hora do login que vem dentro do token (claim `amr`).
export const DURACAO_SESSAO_MS = 8 * 60 * 60 * 1000;

export type EstadoSessao = "sem_sessao" | "expirada" | "precisa_mfa" | "ok";

type Claims = { aal?: string; amr?: unknown } | null | undefined;

// Função pura (testada em testes/admin-sessao.test.ts).
export function estadoSessao(claims: Claims, agoraMs: number): EstadoSessao {
  if (!claims) return "sem_sessao";
  // amr: métodos usados nesta sessão (senha, totp...) com a hora de cada um, em segundos.
  const horas = Array.isArray(claims.amr)
    ? claims.amr.flatMap((m) => (typeof m?.timestamp === "number" ? [m.timestamp * 1000] : []))
    : [];
  if (horas.length === 0 || agoraMs - Math.min(...horas) > DURACAO_SESSAO_MS) return "expirada";
  if (claims.aal !== "aal2") return "precisa_mfa";
  return "ok";
}

// Toda função do admin começa por aqui. Confere login + MFA + idade da sessão e devolve o
// cliente com a sessão. Ser admin (estar na tabela `admins`) quem confere é o banco: um
// usuário que não é admin passa daqui, mas o RLS devolve zero linhas.
export const exigirAdmin = cache(async () => {
  const { supabase, estado } = await lerSessao();
  if (estado === "sem_sessao" || estado === "expirada") redirect("/admin/entrar");
  if (estado === "precisa_mfa") redirect("/admin/mfa");
  return supabase;
});

// Para a tela do código: logado só com a senha fica; quem já passou pelo MFA vai para o admin.
export async function exigirLoginParaMfa() {
  const { supabase, estado } = await lerSessao();
  if (estado === "sem_sessao" || estado === "expirada") redirect("/admin/entrar");
  if (estado === "ok") redirect("/admin");
  const { data } = await supabase.auth.mfa.listFactors();
  return { cadastrado: (data?.totp.length ?? 0) > 0 };
}

async function lerSessao() {
  const supabase = await clienteServidor();
  const { data } = await supabase.auth.getClaims();
  return { supabase, estado: estadoSessao(data?.claims, Date.now()) };
}

export type LeadResumo = {
  id: string;
  created_at: string;
  nome: string;
  servico: string;
  status: string;
};

export async function listarLeadsRecentes(): Promise<LeadResumo[]> {
  const supabase = await exigirAdmin();
  const { data, error } = await supabase
    .from("leads")
    .select("id, created_at, nome, servico, status")
    .order("created_at", { ascending: false })
    .limit(20);
  if (error) throw new Error(`listar_leads falhou: ${error.code ?? "sem_codigo"}`);
  return data;
}
