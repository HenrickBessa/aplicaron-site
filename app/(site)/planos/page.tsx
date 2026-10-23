import type { Metadata } from "next";
import { CabecalhoPagina } from "@/componentes/conteudo/CabecalhoPagina";
import { CartaoPlano } from "@/componentes/conteudo/CartaoPlano";
import { addons, planos, regrasContratacao } from "@/conteudo/planos";
import { JsonLd } from "@/componentes/seo/JsonLd";
import { catalogoPlanos, metadadosPagina } from "@/lib/seo";
import { FormularioPlano } from "./FormularioPlano";

export const metadata: Metadata = metadadosPagina({
  titulo: "Planos de site e sistema com mensalidade",
  descricao:
    "Site, catálogo ou agenda com cobrança automática: pacotes com implantação e mensalidade fixa, prontos em dias. Veja preços e prazos.",
  caminho: "/planos",
});

// Página estática: os planos vêm de conteudo/planos.ts; o formulário só fala com o servidor ao enviar.
export default function PaginaPlanos() {
  return (
    <>
      <JsonLd dados={catalogoPlanos(planos)} />
      <CabecalhoPagina
        titulo="Planos prontos para começar em dias"
        descricao="Implantação com preço fechado e mensalidade fixa. Precisa de algo diferente? O diagnóstico gratuito continua aberto para projetos sob medida."
        caminho="/planos"
        trilha={[{ href: "/", rotulo: "Início" }, { rotulo: "Planos" }]}
      />

      <section aria-labelledby="titulo-planos" className="container-site py-12 sm:py-16">
        <h2 id="titulo-planos" className="sr-only">
          Planos
        </h2>
        <ul className="grid gap-6 lg:grid-cols-3">
          {planos.map((plano) => (
            <li key={plano.slug}>
              <CartaoPlano plano={plano} />
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="titulo-addons" className="border-t border-linha">
        <div className="container-site py-12 sm:py-16">
          <h2 id="titulo-addons" className="text-2xl font-bold sm:text-3xl">
            Add-ons
          </h2>
          <p className="mt-2 max-w-2xl text-cinza-azulado">Para somar a qualquer plano, sempre com valor fechado.</p>
          <ul className="mt-6 grid gap-4 sm:grid-cols-3">
            {addons.map((addon) => (
              <li key={addon.slug} className="rounded-xl border border-linha bg-azul-profundo p-5">
                <p className="font-semibold text-gelo">{addon.nome}</p>
                <p className="mt-2 text-sm text-cinza-azulado">{addon.preco}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="como-funciona" aria-labelledby="titulo-como-funciona" className="border-t border-linha">
        <div className="container-site py-12 sm:py-16">
          <h2 id="titulo-como-funciona" className="text-2xl font-bold sm:text-3xl">
            Como funciona a contratação
          </h2>
          <p className="mt-2 max-w-2xl text-cinza-azulado">Regras que valem para todos os planos, combinadas antes de começar.</p>
          <dl className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {regrasContratacao.map((regra) => (
              <div key={regra.titulo} className="rounded-xl border border-linha bg-azul-profundo p-5">
                <dt className="font-semibold text-gelo">{regra.titulo}</dt>
                <dd className="mt-2 text-sm text-cinza-azulado">{regra.texto}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section id="contratar" aria-label="Formulário de contratação" className="border-t border-linha">
        <div className="container-site py-12 sm:py-16">
          <div className="max-w-3xl">
            <FormularioPlano />
          </div>
        </div>
      </section>
    </>
  );
}
