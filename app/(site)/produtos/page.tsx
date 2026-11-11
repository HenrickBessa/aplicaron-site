import type { Metadata } from "next";
import Link from "next/link";
import { CabecalhoPagina } from "@/componentes/conteudo/CabecalhoPagina";
import { produtos, ROTULO_SITUACAO } from "@/conteudo/produtos";
import { metadadosPagina } from "@/lib/seo";

export const metadata: Metadata = metadadosPagina({
  titulo: "Produtos: agenda, cobrança, pecuária e saúde",
  descricao:
    "Soluções prontas da AplicarOn: Agenda + Cobrança para quem agenda e cobra clientes, AplicarAgro para pecuária a pasto e AplicarSaúde para o idoso.",
  caminho: "/produtos",
});

export default function PaginaProdutos() {
  return (
    <>
      <CabecalhoPagina
        titulo="Produtos"
        descricao="Sistemas nossos, com mensalidade. Você começa rápido e a gente cuida da evolução."
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
                {dados.situacao !== "disponivel" && (
                  <p className="text-sm font-semibold tracking-wide text-ciano uppercase">{ROTULO_SITUACAO[dados.situacao]}</p>
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
