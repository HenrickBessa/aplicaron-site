"use server";

import { redirect } from "next/navigation";
import { after } from "next/server";
import { VERSAO_POLITICA_VIGENTE } from "@/conteudo/privacidade";
import { criarLead } from "@/lib/servicos/leads";
import * as notificacoes from "@/lib/servicos/notificacoes";
import { diagnosticoSchema, errosPorCampo, type CampoDiagnostico, type ErrosCampos } from "@/lib/validacao/diagnostico";

// Server Action = endpoint público. Qualquer um pode chamá-la com qualquer conteúdo,
// sem passar pelo nosso formulário. Por isso ela não confia em nada que recebe.

export type ResultadoEnvio =
  | { ok: false; erros: ErrosCampos }
  | { ok: false; erroGeral: "indisponivel" };

const TEMPO_MINIMO_MS = 3_000;

const CAMPOS_VISIVEIS: readonly CampoDiagnostico[] = [
  "servico",
  "faixa_orcamento",
  "descricao",
  "nome",
  "email",
  "whatsapp",
  "empresa",
  "marketing_optin",
];

// Log provisório só com campos permitidos (o logger definitivo entra na fatia 6).
function registrar(evento: string, extra: Record<string, unknown> = {}) {
  console.error(JSON.stringify({ evento, ...extra }));
}

export async function enviarDiagnostico(entrada: unknown): Promise<ResultadoEnvio> {
  const bruto = typeof entrada === "object" && entrada !== null ? (entrada as Record<string, unknown>) : {};

  // 1. Anti-robô. Robôs costumam preencher todos os campos (inclusive o "site", invisível
  //    para pessoas) e enviar instantaneamente. Respondemos com sucesso falso: o robô não
  //    aprende que foi barrado, e nada é gravado.
  //    O tempo é medido no navegador (duração, não horário), para um relógio errado no
  //    aparelho do visitante não fazer um lead real ser descartado.
  const honeypot = typeof bruto.site === "string" && bruto.site.trim() !== "";
  const tempo = Number(bruto.tempo_preenchimento_ms);
  if (honeypot || !Number.isFinite(tempo) || tempo < TEMPO_MINIMO_MS) {
    redirect("/obrigado");
  }

  // 2. Validação + normalização (mesmo esquema do navegador).
  const validacao = diagnosticoSchema.safeParse(entrada);
  if (!validacao.success) {
    const todos = errosPorCampo(validacao.error);
    const erros = Object.fromEntries(
      Object.entries(todos).filter(([campo]) => CAMPOS_VISIVEIS.includes(campo as CampoDiagnostico)),
    ) as ErrosCampos;
    // Só os NOMES dos campos inválidos; nunca os valores digitados.
    registrar("diagnostico_invalido", { campos: Object.keys(todos) });
    // Erro só em campo que o visitante não vê (ex.: submission_id adulterado): mensagem genérica.
    if (Object.keys(erros).length === 0) return { ok: false, erroGeral: "indisponivel" };
    return { ok: false, erros };
  }

  // 3. Gravação. A versão da política vem do servidor, não do navegador.
  let resultado;
  try {
    resultado = await criarLead({ ...validacao.data, politica_versao: VERSAO_POLITICA_VIGENTE });
  } catch (erro) {
    registrar("criar_lead_falhou", { codigo: erro instanceof Error ? erro.message : "desconhecido" });
    return { ok: false, erroGeral: "indisponivel" };
  }

  // 4. Notificação depois da resposta (não atrasa o visitante). Só para lead novo:
  //    um reenvio do mesmo submission_id não gera um segundo e-mail.
  if (resultado.criado) {
    const leadId = resultado.leadId;
    after(() => notificacoes.enviar(1, leadId));
  }

  redirect("/obrigado");
}
