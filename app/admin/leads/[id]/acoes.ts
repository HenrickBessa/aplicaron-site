"use server";

import { refresh } from "next/cache";
import { exigirAdmin } from "@/lib/dal/admin";
import { adicionarNotaLead, mudarStatusLead } from "@/lib/dal/leads";
import { mudarStatusSchema, novaNotaSchema } from "@/lib/validacao/admin";

// Server Action = endpoint público: confere a sessão primeiro, valida tudo o que vem do
// formulário (inclusive o lead_id escondido) e delega ao DAL. Erro de banco sobe para o
// error.tsx do admin (o DAL lança só com o código, sem dados do lead).

export type ResultadoCrm = { erro: string } | { ok: string } | null;
// Na nota, o erro devolve o texto digitado: o React limpa o formulário depois de toda Action.
export type ResultadoNota = { erro: string; texto: string } | { ok: string } | null;

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

export async function adicionarNota(_anterior: ResultadoNota, form: FormData): Promise<ResultadoNota> {
  await exigirAdmin();
  const texto = form.get("texto");
  const dados = novaNotaSchema.safeParse({ lead_id: form.get("lead_id"), texto });
  const digitado = typeof texto === "string" ? texto : "";
  if (!dados.success) return { erro: "Escreva a nota (até 5.000 caracteres).", texto: digitado };

  if (!(await adicionarNotaLead(dados.data.lead_id, dados.data.texto))) {
    return { erro: "Não foi possível salvar a nota. Recarregue a página e tente de novo.", texto: digitado };
  }
  refresh();
  return { ok: "Nota salva." };
}
