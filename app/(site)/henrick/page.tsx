import type { Metadata } from "next";
import Link from "next/link";
import { CabecalhoPagina } from "@/componentes/conteudo/CabecalhoPagina";
import { JsonLd } from "@/componentes/seo/JsonLd";
import { classesBotao } from "@/componentes/ui/Botao";
import { clientes } from "@/conteudo/clientes";
import { carregar, dadosPerfilSchema } from "@/conteudo/esquemas";
import * as henrickMdx from "@/conteudo/henrick.mdx";
import { produtos, ROTULO_SITUACAO } from "@/conteudo/produtos";
import { dadosPessoa, metadadosPagina } from "@/lib/seo";

// Perfil profissional para recrutadores. Sem ChamadaDiagnostico: o público aqui não é cliente.
const perfil = carregar(dadosPerfilSchema, "henrick", henrickMdx);
const CAMINHO = "/henrick";

export const metadata: Metadata = metadadosPagina({
  titulo: perfil.dados.tituloSeo ?? perfil.dados.titulo,
  descricao: perfil.dados.descricao,
  caminho: CAMINHO,
});

const classeLink = "inline-flex min-h-6 items-center text-ciano underline underline-offset-2 hover:text-gelo";
const classeCartao = "flex flex-col gap-3 rounded-xl border border-linha bg-azul-profundo p-6";

export default function PaginaHenrick() {
  const { dados, Conteudo } = perfil;
  const externo = { target: "_blank", rel: "noopener noreferrer" } as const;
  return (
    <>
      <JsonLd
        dados={dadosPessoa({
          nome: dados.nomeCompleto,
          nomeExibido: dados.titulo,
          cargo: dados.cargo,
          caminho: CAMINHO,
          perfis: [dados.links.linkedin, dados.links.github],
        })}
      />
      <CabecalhoPagina
        titulo={dados.titulo}
        rascunho={dados.rascunho}
        caminho={CAMINHO}
        trilha={[{ href: "/", rotulo: "Início" }, { href: "/sobre", rotulo: "Sobre" }, { rotulo: "Henrick" }]}
      >
        <div className="space-y-1">
          <p className="text-xl font-semibold text-gelo">{dados.cargo}</p>
          <p className="text-cinza-azulado">{dados.cidade} · presencial, híbrido ou remoto</p>
        </div>
        <ul className="flex flex-wrap gap-3 pt-2" aria-label="Contato">
          <li>
            <a href={dados.links.linkedin} {...externo} className={classesBotao("primario")}>
              LinkedIn<span className="sr-only"> (abre em nova aba)</span>
            </a>
          </li>
          <li>
            <a href={dados.links.github} {...externo} className={classesBotao("secundario")}>
              GitHub<span className="sr-only"> (abre em nova aba)</span>
            </a>
          </li>
          <li>
            <a href={`mailto:${dados.links.email}`} className={classesBotao("secundario")}>
              {dados.links.email}
            </a>
          </li>
        </ul>
      </CabecalhoPagina>

      <div className="container-site space-y-16 py-12 sm:py-16">
        {/* Cada projeto tem dois links (case e site no ar), por isso não usa o CartaoCliente, que é um link só. */}
        <section aria-labelledby="titulo-projetos">
          <h2 id="titulo-projetos" className="text-2xl font-bold sm:text-3xl">
            Projetos
          </h2>
          <p className="mt-2 max-w-2xl text-cinza-azulado">Desenvolvidos pela AplicarOn para clientes.</p>
          <ul className="mt-6 grid gap-6 md:grid-cols-2">
            {clientes.map(({ slug, dados: c }) => (
              <li key={slug} className={classeCartao}>
                <h3 className="text-xl font-semibold text-gelo">{c.cliente}</h3>
                <p className="text-cinza-azulado">{c.resumo}</p>
                <p className="text-sm text-cinza-azulado">
                  <span className="text-gelo">Tecnologias:</span> {c.stack.join(" · ")}
                </p>
                <p className="mt-auto flex flex-wrap gap-x-6 gap-y-2 pt-2 text-sm font-medium">
                  <Link href={`/clientes/${slug}`} className={classeLink}>
                    Ver o case<span className="sr-only"> {c.cliente}</span>
                  </Link>
                  <a href={c.site} {...externo} className={classeLink}>
                    {new URL(c.site).hostname.replace(/^www\./, "")}
                    <span className="sr-only"> (site no ar, abre em nova aba)</span>
                  </a>
                </p>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="titulo-produtos">
          <h2 id="titulo-produtos" className="text-2xl font-bold sm:text-3xl">
            Produtos próprios
          </h2>
          <ul className="mt-6 grid gap-6 md:grid-cols-3">
            {produtos.map(({ slug, dados: p }) => (
              <li key={slug} className={classeCartao}>
                <p className="text-sm font-semibold tracking-wide text-ciano uppercase">{ROTULO_SITUACAO[p.situacao]}</p>
                <h3 className="text-xl font-semibold text-gelo">{p.nome}</h3>
                <p className="text-cinza-azulado">{p.resumo}</p>
                <Link href={`/produtos/${slug}`} className={`mt-auto self-start pt-2 text-sm font-medium ${classeLink}`}>
                  Conhecer<span className="sr-only"> {p.nome}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <article className="max-w-3xl [&>:first-child]:mt-0">
          <Conteudo />
        </article>
      </div>
    </>
  );
}
