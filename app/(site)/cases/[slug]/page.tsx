import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CabecalhoPagina } from "@/componentes/conteudo/CabecalhoPagina";
import { ChamadaDiagnostico } from "@/componentes/conteudo/ChamadaDiagnostico";
import { buscarCase, cases } from "@/conteudo/cases";
import { ROTULOS_SERVICO } from "@/lib/validacao/enums";

export function generateStaticParams() {
  return cases.map((c) => ({ slug: c.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: PageProps<"/cases/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const item = buscarCase(slug);
  if (!item) return {};
  return { title: item.dados.titulo, description: item.dados.descricao };
}

export default async function PaginaCase({ params }: PageProps<"/cases/[slug]">) {
  const { slug } = await params;
  const item = buscarCase(slug);
  if (!item) notFound();

  const { dados, Conteudo } = item;

  return (
    <>
      <CabecalhoPagina
        titulo={dados.titulo}
        descricao={dados.descricao}
        rascunho={dados.rascunho}
        trilha={[{ href: "/", rotulo: "Início" }, { href: "/#cases", rotulo: "Cases" }, { rotulo: dados.titulo }]}
      >
        <dl className="grid max-w-2xl gap-4 pt-2 text-sm sm:grid-cols-3">
          {[
            ["Cliente", dados.cliente],
            ["Setor", dados.setor],
            ["Serviço", ROTULOS_SERVICO[dados.servico]],
          ].map(([termo, valor]) => (
            <div key={termo}>
              <dt className="text-cinza-azulado">{termo}</dt>
              <dd className="font-medium text-gelo">{valor}</dd>
            </div>
          ))}
        </dl>
      </CabecalhoPagina>
      <div className="container-site py-8 sm:py-12">
        <article className="max-w-3xl [&>:first-child]:mt-0">
          <p className="rounded-lg border border-linha bg-azul-profundo p-4 font-medium text-gelo">{dados.resultado}</p>
          <Conteudo />
        </article>
      </div>
      <ChamadaDiagnostico servico={dados.servico} />
    </>
  );
}
