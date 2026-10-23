import type { Metadata } from "next";
import { CabecalhoPagina } from "@/componentes/conteudo/CabecalhoPagina";
import { CartaoCliente } from "@/componentes/conteudo/CartaoCliente";
import { ChamadaDiagnostico } from "@/componentes/conteudo/ChamadaDiagnostico";
import { Revelar } from "@/componentes/ui/Revelar";
import { clientes } from "@/conteudo/clientes";
import { metadadosPagina } from "@/lib/seo";

export const metadata: Metadata = metadadosPagina({
  titulo: "Portfólio: sites e sistemas entregues",
  descricao: "Uma seleção de projetos da AplicarOn: telemedicina, clínica com prontuário eletrônico, incorporadora e atacado B2B, com telas e o que mudou.",
  caminho: "/clientes",
});

export default function PaginaClientes() {
  return (
    <>
      <CabecalhoPagina
        titulo="Clientes"
        descricao="Uma seleção dos projetos que entregamos e do que mudou para cada cliente."
        caminho="/clientes"
        trilha={[{ href: "/", rotulo: "Início" }, { rotulo: "Clientes" }]}
      />
      <div className="container-site py-12 sm:py-16">
        <ul className="grid gap-6 sm:grid-cols-2">
          {clientes.map((cliente) => (
            <li key={cliente.slug}>
              <Revelar className="h-full">
                <CartaoCliente cliente={cliente} nivelTitulo="h2" />
              </Revelar>
            </li>
          ))}
        </ul>
      </div>
      <ChamadaDiagnostico />
    </>
  );
}
