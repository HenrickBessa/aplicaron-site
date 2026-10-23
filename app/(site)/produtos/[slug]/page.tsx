import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FormularioPlano } from "@/app/(site)/planos/FormularioPlano";
import { CabecalhoPagina } from "@/componentes/conteudo/CabecalhoPagina";
import { CartaoPlano } from "@/componentes/conteudo/CartaoPlano";
import { buscarPlano } from "@/conteudo/planos";
import { buscarProduto, produtos } from "@/conteudo/produtos";
import { JsonLd } from "@/componentes/seo/JsonLd";
import { dadosProduto, metadadosPagina } from "@/lib/seo";

export function generateStaticParams() {
  return produtos.map((p) => ({ slug: p.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: PageProps<"/produtos/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const produto = buscarProduto(slug);
  if (!produto) return {};
  return metadadosPagina({ titulo: produto.dados.tituloSeo, descricao: produto.dados.descricao, caminho: `/produtos/${slug}` });
}

export default async function PaginaProduto({ params }: PageProps<"/produtos/[slug]">) {
  const { slug } = await params;
  const produto = buscarProduto(slug);
  if (!produto) notFound();

  const { dados, Conteudo } = produto;
  const plano = dados.plano ? buscarPlano(dados.plano) : undefined;

  return (
    <>
      <JsonLd dados={dadosProduto({ nome: dados.nome, descricao: dados.descricao, caminho: `/produtos/${slug}`, plano })} />
      <CabecalhoPagina
        titulo={dados.titulo}
        descricao={dados.resumo}
        rascunho={dados.rascunho}
        caminho={`/produtos/${slug}`}
        trilha={[{ href: "/", rotulo: "Início" }, { href: "/produtos", rotulo: "Produtos" }, { rotulo: dados.nome }]}
      />
      <div className="container-site grid gap-10 py-8 sm:py-12 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <article className="max-w-3xl [&>:first-child]:mt-0">
          <Conteudo />
        </article>
        {plano && (
          <aside aria-label="Preço">
            <CartaoPlano plano={plano} mostrarPagina={false} />
          </aside>
        )}
      </div>
      {plano && (
        <section id="contratar" aria-label="Formulário de contratação" className="border-t border-linha">
          <div className="container-site py-12 sm:py-16">
            <div className="max-w-3xl">
              <FormularioPlano planoInicial={plano.slug} />
            </div>
          </div>
        </section>
      )}
    </>
  );
}
