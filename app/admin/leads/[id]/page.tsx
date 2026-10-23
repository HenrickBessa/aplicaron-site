import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { addons, buscarPlano } from "@/conteudo/planos";
import { exigirAdmin } from "@/lib/dal/admin";
import { buscarLead } from "@/lib/dal/leads";
import { ROTULOS_FAIXA, ROTULOS_SERVICO, ROTULOS_STATUS } from "@/lib/validacao/enums";
import { dataHora } from "../../formatos";
import { FormularioNota } from "./FormularioNota";
import { FormularioStatus } from "./FormularioStatus";

// Título genérico: o nome do lead não vai para a aba nem para o histórico do navegador.
export const metadata: Metadata = { title: "Lead" };

function Item({ termo, children }: { termo: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-sm text-cinza-azulado">{termo}</dt>
      <dd className="mt-0.5 break-words">{children ?? "—"}</dd>
    </div>
  );
}

const data = (iso: string) => dataHora.format(new Date(iso));

export default async function PaginaLead({ params }: PageProps<"/admin/leads/[id]">) {
  await exigirAdmin();
  const lead = await buscarLead((await params).id);
  // Inválido, inexistente ou sem permissão: a mesma resposta, para não revelar se o lead existe.
  if (!lead) notFound();

  const plano = lead.plano_interesse ? buscarPlano(lead.plano_interesse)?.nome : null;
  const nomesAddons = lead.addons.map((a) => addons.find((x) => x.slug === a)?.nome ?? a);
  const utm = [lead.utm_source, lead.utm_medium, lead.utm_campaign].filter(Boolean).join(" / ");

  return (
    <article className="space-y-10">
      <div>
        <Link href="/admin" className="text-ciano underline underline-offset-2">
          ← Voltar para os leads
        </Link>
        <h1 className="mt-4 text-2xl font-bold">{lead.nome}</h1>
        <p className="mt-1 text-cinza-azulado">
          Recebido em {data(lead.created_at)} · Status: <strong className="text-gelo">{ROTULOS_STATUS[lead.status]}</strong>
        </p>
        {lead.anonimizado_em && (
          <p className="mt-2 text-cinza-azulado">Dados pessoais removidos em {data(lead.anonimizado_em)} (LGPD).</p>
        )}
      </div>

      <section aria-labelledby="titulo-pedido">
        <h2 id="titulo-pedido" className="text-lg font-semibold">
          Pedido
        </h2>
        <dl className="mt-4 grid gap-4 sm:grid-cols-2">
          <Item termo="Serviço">{ROTULOS_SERVICO[lead.servico]}</Item>
          {plano ? (
            <Item termo="Plano">{plano}</Item>
          ) : (
            <Item termo="Faixa de orçamento">{lead.faixa_orcamento && ROTULOS_FAIXA[lead.faixa_orcamento]}</Item>
          )}
          {nomesAddons.length > 0 && <Item termo="Add-ons">{nomesAddons.join(", ")}</Item>}
          <Item termo="Empresa">{lead.empresa}</Item>
          <Item termo="Cidade">{lead.cidade}</Item>
          <Item termo="Segmento">{lead.segmento}</Item>
        </dl>
        <h3 className="mt-6 text-sm text-cinza-azulado">Descrição</h3>
        <p className="mt-0.5 whitespace-pre-line break-words">{lead.descricao}</p>
      </section>

      <section aria-labelledby="titulo-contato">
        <h2 id="titulo-contato" className="text-lg font-semibold">
          Contato
        </h2>
        <dl className="mt-4 grid gap-4 sm:grid-cols-2">
          <Item termo="E-mail">
            {lead.email && (
              <a href={`mailto:${lead.email}`} className="text-ciano underline underline-offset-2">
                {lead.email}
              </a>
            )}
          </Item>
          <Item termo="WhatsApp">
            {lead.whatsapp && (
              <a
                href={`https://wa.me/${lead.whatsapp.slice(1)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-ciano underline underline-offset-2"
              >
                {lead.whatsapp}
              </a>
            )}
          </Item>
          <Item termo="Aceita receber novidades">{lead.marketing_optin ? "Sim" : "Não"}</Item>
        </dl>
      </section>

      <section aria-labelledby="titulo-status">
        <h2 id="titulo-status" className="text-lg font-semibold">
          Andamento
        </h2>
        <div className="mt-4">
          <FormularioStatus leadId={lead.id} status={lead.status} versao={lead.versao} />
        </div>
        <h3 className="mt-6 font-medium">Histórico de status</h3>
        {lead.lead_status_historico.length === 0 ? (
          <p className="mt-2 text-cinza-azulado">O status ainda não mudou.</p>
        ) : (
          <ol className="mt-2 space-y-1">
            {lead.lead_status_historico.map((h) => (
              <li key={h.id}>
                <span className="text-cinza-azulado">{data(h.alterado_em)}:</span> {ROTULOS_STATUS[h.status_anterior]} →{" "}
                {ROTULOS_STATUS[h.status_novo]}
              </li>
            ))}
          </ol>
        )}
      </section>

      <section aria-labelledby="titulo-notas">
        <h2 id="titulo-notas" className="text-lg font-semibold">
          Notas
        </h2>
        <div className="mt-4">
          <FormularioNota leadId={lead.id} />
        </div>
        {lead.lead_notas.length === 0 ? (
          <p className="mt-6 text-cinza-azulado">Nenhuma nota ainda.</p>
        ) : (
          <ol className="mt-6 space-y-4">
            {lead.lead_notas.map((n) => (
              <li key={n.id} className="rounded-lg border border-linha bg-azul-profundo p-4">
                <p className="text-sm text-cinza-azulado">{data(n.created_at)}</p>
                <p className="mt-1 whitespace-pre-line break-words">{n.texto}</p>
              </li>
            ))}
          </ol>
        )}
      </section>

      <section aria-labelledby="titulo-origem">
        <h2 id="titulo-origem" className="text-lg font-semibold">
          Origem
        </h2>
        <dl className="mt-4 grid gap-4 sm:grid-cols-2">
          <Item termo="Página">{lead.pagina_origem}</Item>
          <Item termo="UTM (origem / mídia / campanha)">{utm || null}</Item>
          <Item termo="Última atividade">{data(lead.ultima_atividade_em)}</Item>
        </dl>
      </section>
    </article>
  );
}
