"use server";

import { headers } from "next/headers";
import { after } from "next/server";
import { buscarPlano, mensagemWhatsappPlano } from "@/conteudo/planos";
import { VERSAO_POLITICA_VIGENTE } from "@/conteudo/privacidade";
import { linkWhatsappCom, linkWhatsappComMensagem } from "@/conteudo/site";
import { log } from "@/lib/logger";
import { criarLead } from "@/lib/servicos/leads";
import * as notificacoes from "@/lib/servicos/notificacoes";
import { errosPorCampo } from "@/lib/validacao/diagnostico";
import { interessePlanoSchema, type CampoPlano, type ErrosPlano } from "@/lib/validacao/plano";

// Server Action = endpoint público (ver diagnostico/acoes.ts). Grava o lead e devolve o link do
// WhatsApp com a mensagem montada; o navegador abre o link na mesma aba (aba nova depois de
// esperar o servidor seria bloqueada como pop-up).

export type ResultadoPlano =
  | { ok: true; whatsapp: string }
  | { ok: false; erros: ErrosPlano }
  | { ok: false; erroGeral: "indisponivel" };

const TEMPO_MINIMO_MS = 3_000;

const CAMPOS_VISIVEIS: readonly CampoPlano[] = [
  "plano",
  "addons",
  "descricao",
  "nome",
  "email",
  "whatsapp",
  "empresa",
  "cidade",
  "segmento",
  "marketing_optin",
];

export async function enviarInteressePlano(entrada: unknown): Promise<ResultadoPlano> {
  const requestId = (await headers()).get("x-vercel-id") ?? undefined;
  const bruto = typeof entrada === "object" && entrada !== null ? (entrada as Record<string, unknown>) : {};

  // Anti-robô: sucesso falso com o link genérico, nada gravado.
  const honeypot = typeof bruto.site === "string" && bruto.site.trim() !== "";
  const tempo = Number(bruto.tempo_preenchimento_ms);
  if (honeypot || !Number.isFinite(tempo) || tempo < TEMPO_MINIMO_MS) {
    return { ok: true, whatsapp: linkWhatsappComMensagem };
  }

  const validacao = interessePlanoSchema.safeParse(entrada);
  if (!validacao.success) {
    const todos = errosPorCampo<CampoPlano>(validacao.error);
    const erros = Object.fromEntries(
      Object.entries(todos).filter(([campo]) => CAMPOS_VISIVEIS.includes(campo as CampoPlano)),
    ) as ErrosPlano;
    log.aviso("plano_invalido", { request_id: requestId, codigo: `invalido:${Object.keys(todos).join(",")}` });
    if (Object.keys(erros).length === 0) return { ok: false, erroGeral: "indisponivel" };
    return { ok: false, erros };
  }

  const dados = validacao.data;
  const plano = buscarPlano(dados.plano)!;
  let resultado;
  try {
    resultado = await criarLead({
      ...dados,
      servico: plano.servico,
      plano_interesse: dados.plano,
      politica_versao: VERSAO_POLITICA_VIGENTE,
    });
  } catch (erro) {
    log.erro("criar_lead_falhou", {
      request_id: requestId,
      servico: plano.servico,
      codigo: erro instanceof Error ? erro.message : "desconhecido",
    });
    return { ok: false, erroGeral: "indisponivel" };
  }

  if (resultado.criado) {
    const leadId = resultado.leadId;
    after(() => notificacoes.enviar(1, leadId));
  }

  return { ok: true, whatsapp: linkWhatsappCom(mensagemWhatsappPlano(dados)) };
}
