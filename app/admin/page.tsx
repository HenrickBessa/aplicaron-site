import type { Metadata } from "next";
import Form from "next/form";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Botao, BotaoLink } from "@/componentes/ui/Botao";
import { CampoSelecao, CampoTexto } from "@/componentes/ui/campos";
import { buscarPlano, planos } from "@/conteudo/planos";
import { exigirAdmin } from "@/lib/dal/admin";
import { LEADS_POR_PAGINA, listarLeads } from "@/lib/dal/leads";
import { filtrosLeadsSchema, urlLista } from "@/lib/validacao/admin";
import { ROTULOS_SERVICO, ROTULOS_STATUS, SERVICOS, STATUS_LEAD } from "@/lib/validacao/enums";
import { sair } from "./acoes";
import { dataHora } from "./formatos";

export const metadata: Metadata = { title: "Leads" };

const TODOS = { valor: "", rotulo: "Todos" };
const OPCOES_STATUS = [TODOS, ...STATUS_LEAD.map((valor) => ({ valor, rotulo: ROTULOS_STATUS[valor] }))];
const OPCOES_SERVICO = [TODOS, ...SERVICOS.map((valor) => ({ valor, rotulo: ROTULOS_SERVICO[valor] }))];
const OPCOES_PLANO = [TODOS, ...planos.map((p) => ({ valor: p.slug, rotulo: p.nome }))];

const classeLink = "text-ciano underline underline-offset-2";

export default async function PaginaAdmin({ searchParams }: PageProps<"/admin">) {
  await exigirAdmin();
  const filtros = filtrosLeadsSchema.parse(await searchParams);
  const { leads, total } = await listarLeads(filtros);
  // Página depois da última (URL editada, ou leads que mudaram de status): volta para a primeira.
  if (leads.length === 0 && filtros.pagina > 1) redirect(urlLista(filtros, 1));
  const paginas = Math.max(1, Math.ceil(total / LEADS_POR_PAGINA));
  const filtrando = Boolean(filtros.status || filtros.servico || filtros.plano || filtros.busca);

  return (
    <section>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Leads</h1>
        <form action={sair}>
          <Botao type="submit" variante="secundario">
            Sair
          </Botao>
        </form>
      </div>

      {/* GET: os filtros ficam na URL (dá para recarregar, voltar e guardar o link). */}
      <Form action="/admin" className="mt-6 grid items-end gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <CampoTexto
            id="busca"
            name="busca"
            type="search"
            rotulo="Buscar"
            dica="Nome, e-mail ou empresa"
            maxLength={100}
            required={false}
            defaultValue={filtros.busca}
          />
        </div>
        <CampoSelecao id="filtro-status" name="status" rotulo="Status" opcoes={OPCOES_STATUS} required={false} defaultValue={filtros.status ?? ""} />
        <CampoSelecao id="filtro-servico" name="servico" rotulo="Serviço" opcoes={OPCOES_SERVICO} required={false} defaultValue={filtros.servico ?? ""} />
        <CampoSelecao id="filtro-plano" name="plano" rotulo="Plano" opcoes={OPCOES_PLANO} required={false} defaultValue={filtros.plano ?? ""} />
        <div className="flex flex-wrap gap-3 sm:col-span-2 lg:col-span-5">
          <Botao type="submit">Filtrar</Botao>
          {filtrando && (
            <BotaoLink href="/admin" variante="secundario">
              Limpar filtros
            </BotaoLink>
          )}
        </div>
      </Form>

      <p role="status" className="mt-6 text-cinza-azulado">
        {total === 1 ? "1 lead" : `${total} leads`}
        {filtrando && " com estes filtros"}
      </p>

      {leads.length > 0 && (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">Leads, do mais recente ao mais antigo</caption>
            <thead className="border-b border-borda-campo text-cinza-azulado">
              <tr>
                <th scope="col" className="py-2 pr-4 font-medium">Recebido</th>
                <th scope="col" className="py-2 pr-4 font-medium">Nome</th>
                <th scope="col" className="py-2 pr-4 font-medium">Serviço</th>
                <th scope="col" className="py-2 pr-4 font-medium">Plano</th>
                <th scope="col" className="py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr key={lead.id} className="border-b border-linha">
                  <td className="py-2 pr-4 whitespace-nowrap">{dataHora.format(new Date(lead.created_at))}</td>
                  <td className="py-2 pr-4">
                    <Link href={`/admin/leads/${lead.id}`} className={classeLink}>
                      {lead.nome}
                    </Link>
                  </td>
                  <td className="py-2 pr-4">{ROTULOS_SERVICO[lead.servico]}</td>
                  <td className="py-2 pr-4">{lead.plano_interesse ? buscarPlano(lead.plano_interesse)?.nome : "—"}</td>
                  <td className="py-2">{ROTULOS_STATUS[lead.status]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {paginas > 1 && (
        <nav aria-label="Páginas da lista" className="mt-6 flex flex-wrap items-center gap-4">
          {filtros.pagina > 1 && (
            <Link href={urlLista(filtros, filtros.pagina - 1)} className={classeLink}>
              ← Anterior
            </Link>
          )}
          <span>
            Página {filtros.pagina} de {paginas}
          </span>
          {filtros.pagina < paginas && (
            <Link href={urlLista(filtros, filtros.pagina + 1)} className={classeLink}>
              Próxima →
            </Link>
          )}
        </nav>
      )}
    </section>
  );
}
