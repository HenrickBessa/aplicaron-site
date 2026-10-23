import type { Metadata } from "next";
import Link from "next/link";
import { CabecalhoPagina } from "@/componentes/conteudo/CabecalhoPagina";
import { produtos } from "@/conteudo/produtos";
import { metadadosPagina } from "@/lib/seo";

export const metadata: Metadata = metadadosPagina({
  titulo: "Produtos prontos para o seu negócio",
  descricao: "Sistemas da AplicarOn prontos para usar, com mensalidade: agenda com lembrete no WhatsApp, cobrança automática e mais.",
  caminho: "/produtos",
});

export default function PaginaProdutos() {
  return (
    <>
      <CabecalhoPagina
        titulo="Produtos"
        descricao="Sistemas nossos, prontos para usar e com mensalidade. Você começa rápido e a gente cuida da evolução."
        caminho="/produtos"
        trilha={[{ href: "/", rotulo: "Início" }, { rotulo: "Produtos" }]}
      />
      <div className="container-site py-12 sm:py-16">
        <ul className="grid gap-6 sm:grid-cols-2">
          {produtos.map(({ slug, dados }) => (
            <li key={slug}>
              <Link
                href={`/produtos/${slug}`}
                className="cartao-interativo group flex h-full flex-col gap-3 rounded-xl border border-linha bg-azul-profundo p-6 sm:p-8"
              >
                {dados.situacao === "em_desenvolvimento" && (
                  <p className="text-sm font-semibold tracking-wide text-ciano uppercase">Em desenvolvimento</p>
                )}
                <h2 className="text-2xl font-semibold text-gelo group-hover:text-ciano">{dados.nome}</h2>
                <p className="text-cinza-azulado">{dados.resumo}</p>
                <span className="mt-auto text-sm font-medium text-ciano" aria-hidden>
                  Conhecer →
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
