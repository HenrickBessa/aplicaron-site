import "server-only";
import { log } from "@/lib/logger";
import { clienteSistema } from "@/lib/supabase/sistema";
import { buscarPlano } from "@/conteudo/planos";
import { ROTULOS_FAIXA, ROTULOS_SERVICO, type FaixaOrcamento, type Plano, type Servico } from "@/lib/validacao/enums";

// Aviso interno de "novo diagnóstico" por e-mail (Resend).
// Fluxo por lead: reivindicar (trava de 2 min no banco) -> enviar -> concluir (backoff se falhar).
// O e-mail NÃO contém dados pessoais: só serviço, faixa, plano e o link do admin.

const TIMEOUT_RESEND_MS = 10_000;
// Para de pegar novos leads depois deste tempo, bem antes de a função da Vercel ser encerrada.
const PRAZO_LOTE_MS = 40_000;

type Reivindicado = {
  id: string;
  tentativa: number;
  servico: Servico;
  // Lead de plano vem sem faixa e com plano; lead de diagnóstico, com faixa (e plano opcional).
  faixa_orcamento: FaixaOrcamento | null;
  plano_interesse?: Plano | null;
};

function configuracao() {
  const chave = process.env.RESEND_API_KEY;
  const de = process.env.NOTIFICACAO_EMAIL_DE;
  const para = process.env.NOTIFICACAO_EMAIL_PARA;
  const site = process.env.NEXT_PUBLIC_SITE_URL;
  if (!chave || !de || !para || !site) return null;
  return { chave, de, para, site };
}

export function montarEmail(lead: Pick<Reivindicado, "id" | "servico" | "faixa_orcamento" | "plano_interesse">, site: string) {
  const link = `${site.replace(/\/$/, "")}/admin/leads/${lead.id}`;
  const plano = lead.plano_interesse ? buscarPlano(lead.plano_interesse)?.nome : undefined;

  // Sem faixa = veio da página /planos.
  if (!lead.faixa_orcamento) {
    return {
      subject: `Novo interesse: plano ${plano}`,
      text: `Novo interesse em plano pelo site.\n\nPlano: ${plano}\n\nVer detalhes: ${link}\n`,
      html:
        `<p>Novo interesse em plano pelo site.</p>` +
        `<p><strong>Plano:</strong> ${plano}</p>` +
        `<p><a href="${link}">Ver detalhes no painel</a></p>`,
    };
  }

  const servico = ROTULOS_SERVICO[lead.servico];
  const faixa = ROTULOS_FAIXA[lead.faixa_orcamento];
  const linhaPlano = plano ? `\nPlano de interesse: ${plano}` : "";
  return {
    subject: `Novo diagnóstico: ${servico}, ${faixa}`,
    text: `Novo diagnóstico recebido.\n\nServiço: ${servico}\nOrçamento: ${faixa}${linhaPlano}\n\nVer detalhes: ${link}\n`,
    html:
      `<p>Novo diagnóstico recebido.</p>` +
      `<p><strong>Serviço:</strong> ${servico}<br><strong>Orçamento:</strong> ${faixa}` +
      (plano ? `<br><strong>Plano de interesse:</strong> ${plano}` : "") +
      `</p><p><a href="${link}">Ver detalhes no painel</a></p>`,
  };
}

// Devolve null em caso de sucesso, ou um código curto de erro (vai para o banco e o log; nunca dados do lead).
async function enviarEmail(lead: Reivindicado, cfg: NonNullable<ReturnType<typeof configuracao>>): Promise<string | null> {
  try {
    const resposta = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${cfg.chave}`,
        "Content-Type": "application/json",
        // Mesmo lead = mesma chave: se este envio for repetido em até 24 h (ex.: o resultado se
        // perdeu e a trava venceu), o Resend não manda um segundo e-mail.
        "Idempotency-Key": `lead-${lead.id}`,
      },
      body: JSON.stringify({ from: cfg.de, to: [cfg.para], ...montarEmail(lead, cfg.site) }),
      signal: AbortSignal.timeout(TIMEOUT_RESEND_MS),
    });
    return resposta.ok ? null : `http_${resposta.status}`;
  } catch (erro) {
    return erro instanceof Error && erro.name === "TimeoutError" ? "timeout" : "rede";
  }
}

// Processa até `limite` notificações pendentes, uma por vez. Com `leadId`, só aquele lead
// (usado logo após o envio do formulário). Devolve quantas foram enviadas com sucesso.
export async function enviar(limite: number, leadId?: string): Promise<number> {
  const cfg = configuracao();
  if (!cfg) {
    // Sem configuração não reivindicamos nada: não queimamos tentativas à toa.
    log.aviso("notificacao_desativada");
    return 0;
  }

  const sistema = clienteSistema().schema("sistema");
  const inicio = Date.now();
  let enviadas = 0;

  for (let i = 0; i < limite && Date.now() - inicio < PRAZO_LOTE_MS; i++) {
    const { data, error } = await sistema.rpc("reivindicar_notificacoes", {
      p_limite: 1,
      p_lead_id: leadId ?? null,
    });
    if (error) {
      log.erro("reivindicar_falhou", { codigo: error.code });
      break;
    }
    const lead = (data as Reivindicado[] | null)?.[0];
    if (!lead) break; // fila vazia

    const codigo = await enviarEmail(lead, cfg);
    const { error: erroConcluir } = await sistema.rpc("concluir_notificacao", {
      p_id: lead.id,
      p_tentativa: lead.tentativa,
      p_ok: codigo === null,
      p_codigo: codigo,
    });
    if (erroConcluir) log.erro("concluir_falhou", { lead_id: lead.id, codigo: erroConcluir.code });

    if (codigo === null) {
      enviadas++;
    } else {
      // Falha com nova tentativa agendada é aviso; a 5ª (última) falha é erro e vai ao Sentry.
      const nivel = lead.tentativa >= 5 ? log.erro : log.aviso;
      nivel("notificacao_falhou", { lead_id: lead.id, servico: lead.servico, codigo });
    }
  }

  return enviadas;
}
