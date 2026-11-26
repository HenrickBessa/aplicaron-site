import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { CabecalhoPagina } from "@/componentes/conteudo/CabecalhoPagina";
import { ChamadaDiagnostico } from "@/componentes/conteudo/ChamadaDiagnostico";
import { buscarCliente, clientes } from "@/conteudo/clientes";
import { metadadosPagina } from "@/lib/seo";
import { ROTULOS_SERVICO } from "@/lib/validacao/enums";

export function generateStaticParams() {
  return clientes.map((c) => ({ slug: c.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: PageProps<"/clientes/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const cliente = buscarCliente(slug);
  if (!cliente) return {};
  return metadadosPagina({ titulo: cliente.dados.tituloSeo ?? cliente.dados.titulo, descricao: cliente.dados.descricao, caminho: `/clientes/${slug}` });
}

export default async function PaginaCliente({ params }: PageProps<"/clientes/[slug]">) {
  const { slug } = await params;
  const cliente = buscarCliente(slug);
  if (!cliente) notFound();

  const { dados, logo, Conteudo } = cliente;
  // Serviço principal do case: o diagnóstico já abre com ele selecionado.
  const servicoPrincipal = dados.servicos[0];

  return (
    <>
      <CabecalhoPagina
        titulo={dados.titulo}
        descricao={dados.descricao}
        caminho={`/clientes/${slug}`}
        trilha={[{ href: "/", rotulo: "Início" }, { href: "/clientes", rotulo: "Clientes" }, { rotulo: dados.cliente }]}
      >
        <div className="flex flex-wrap items-center gap-6 pt-2">
          <div className="flex h-24 w-40 items-center justify-center rounded-lg border border-linha bg-azul-profundo p-4">
            <Image src={logo} alt={`Logo ${dados.cliente}`} className="h-16 w-auto object-contain" sizes="160px" priority />
          </div>
          <dl className="grid gap-4 text-sm sm:grid-cols-3">
            {[
              ["Cliente", dados.cliente],
              ["Setor", dados.setor],
              ["Cidade", dados.cidade],
            ].map(([termo, valor]) => (
              <div key={termo}>
                <dt className="text-cinza-azulado">{termo}</dt>
                <dd className="font-medium text-gelo">{valor}</dd>
              </div>
            ))}
          </dl>
        </div>
        <ul className="flex flex-wrap gap-2" aria-label="Serviços entregues">
          {dados.servicos.map((s) => (
            <li key={s} className="rounded-full border border-ciano/60 px-3 py-1 text-sm text-gelo">
              {ROTULOS_SERVICO[s]}
            </li>
          ))}
        </ul>
        <p className="text-sm text-cinza-azulado">
          <span className="text-gelo">Tecnologias:</span> {dados.stack.join(" · ")}
        </p>
      </CabecalhoPagina>
      <div className="container-site py-8 sm:py-12">
        <section aria-labelledby="titulo-resultado" className="mb-10 max-w-3xl rounded-xl border border-ciano/40 bg-azul-profundo p-6">
          <h2 id="titulo-resultado" className="text-sm font-semibold tracking-widest text-ciano uppercase">
            O que mudou
          </h2>
          <p className="mt-3 text-lg text-gelo">{dados.resultado}</p>
          {/* Citação só com o ok do cliente: em rascunho, nem chega ao HTML. */}
          {dados.depoimento?.status === "aprovado" && (
            <figure className="mt-5 border-l-2 border-ciano pl-4">
              <blockquote className="text-gelo italic">
                <p>“{dados.depoimento.texto}”</p>
              </blockquote>
              <figcaption className="mt-2 text-sm text-cinza-azulado">{dados.cliente}</figcaption>
            </figure>
          )}
        </section>
        <article className="max-w-3xl [&>:first-child]:mt-0">
          <Conteudo />
          <p className="mt-10">
            <a
              href={dados.site}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-ciano underline underline-offset-2 hover:text-gelo"
            >
              Visitar {new URL(dados.site).hostname.replace(/^www\./, "")}
              <span className="sr-only"> (site do cliente {dados.cliente}, abre em nova aba)</span>
            </a>
          </p>
        </article>
      </div>
      <ChamadaDiagnostico servico={servicoPrincipal} />
    </>
  );
}
