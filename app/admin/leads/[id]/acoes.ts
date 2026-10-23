"use server";

import { refresh } from "next/cache";
import { exigirAdmin } from "@/lib/dal/admin";
import { mudarStatusLead } from "@/lib/dal/leads";
import { mudarStatusSchema } from "@/lib/validacao/admin";

// Server Action = endpoint público: confere a sessão primeiro, valida tudo o que vem do
// formulário (inclusive o lead_id escondido) e delega ao DAL. Erro de banco sobe para o
// error.tsx do admin (o DAL lança só com o código, sem dados do lead).

export type ResultadoCrm = { erro: string } | { ok: string } | null;

export async function mudarStatus(_anterior: ResultadoCrm, form: FormData): Promise<ResultadoCrm> {
  await exigirAdmin();
  const dados = mudarStatusSchema.safeParse({
    lead_id: form.get("lead_id"),
    status: form.get("status"),
    versao: form.get("versao"),
  });
  if (!dados.success) return { erro: "Escolha um status da lista." };

  const { lead_id, status, versao } = dados.data;
  if (!(await mudarStatusLead(lead_id, status, versao))) {
    return { erro: "O lead mudou desde que esta página abriu. Recarregue a página e tente de novo." };
  }
  refresh();
  return { ok: "Status salvo." };
}
