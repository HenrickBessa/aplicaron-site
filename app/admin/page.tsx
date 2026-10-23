import type { Metadata } from "next";
import { Botao } from "@/componentes/ui/Botao";
import { buscarPlano } from "@/conteudo/planos";
import { listarLeadsRecentes } from "@/lib/dal/admin";
import { sair } from "./acoes";

export const metadata: Metadata = { title: "Leads" };

const dataHora = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "America/Sao_Paulo",
});

export default async function PaginaAdmin() {
  const leads = await listarLeadsRecentes();

  return (
    <section>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Leads recentes</h1>
        <form action={sair}>
          <Botao type="submit" variante="secundario">
            Sair
          </Botao>
        </form>
      </div>

      {leads.length === 0 ? (
        <p className="mt-6 text-cinza-azulado">Nenhum lead ainda.</p>
      ) : (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">Os 20 leads mais recentes</caption>
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
                  <td className="py-2 pr-4">{lead.nome}</td>
                  <td className="py-2 pr-4">{lead.servico}</td>
                  <td className="py-2 pr-4">{lead.plano_interesse ? buscarPlano(lead.plano_interesse)?.nome : "—"}</td>
                  <td className="py-2">{lead.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="mt-6 text-sm text-cinza-azulado">Detalhe, notas e mudança de status chegam na próxima fatia (CRM).</p>
    </section>
  );
}
