import Link from "next/link";
import { ChamadaDiagnostico } from "@/componentes/conteudo/ChamadaDiagnostico";
import { SeloRascunho } from "@/componentes/conteudo/CabecalhoPagina";
import { BotaoLink } from "@/componentes/ui/Botao";
import { cases } from "@/conteudo/cases";
import { servicos } from "@/conteudo/servicos";
import { chamadaPrincipal } from "@/conteudo/site";
import { ROTULOS_SERVICO } from "@/lib/validacao/enums";

// RASCUNHO: textos da home são provisórios. Serviços e cases vêm dos arquivos MDX.
const etapas = [
  { titulo: "Diagnóstico", texto: "Você conta o problema em 3 etapas rápidas. Respondemos em até um dia útil." },
  { titulo: "Proposta", texto: "Escopo, prazo e investimento claros, com entregas em etapas." },
  { titulo: "Entrega", texto: "Você acompanha cada etapa e recebe o código, os dados e a documentação." },
];

export default function Inicio() {
  return (
    <>
      <section className="container-site space-y-6 py-16 sm:py-24">
        <SeloRascunho />
        <h1 className="max-w-3xl text-4xl font-bold sm:text-6xl">Tecnologia sob medida para o seu negócio crescer</h1>
        <p className="max-w-2xl text-lg text-cinza-azulado">
          Sites, sistemas, aplicativos e automação com IA. Do diagnóstico à entrega, com segurança e foco em resultado.
        </p>
        <div className="flex flex-wrap gap-3 pt-2">
          <BotaoLink href={chamadaPrincipal.href}>{chamadaPrincipal.rotulo}</BotaoLink>
          <BotaoLink href="/#servicos" variante="secundario">
            Ver serviços
          </BotaoLink>
        </div>
      </section>

      <section id="servicos" aria-labelledby="titulo-servicos" className="border-t border-linha">
        <div className="container-site py-16">
          <h2 id="titulo-servicos" className="text-2xl font-bold sm:text-3xl">
            Serviços
          </h2>
          <ul className="mt-8 grid gap-4 sm:grid-cols-2">
            {servicos.map(({ slug, dados }) => (
              <li key={slug}>
                {/* O cartão inteiro é clicável; o nome do link é o título do serviço. */}
                <Link
                  href={`/servicos/${slug}`}
                  className="group block h-full rounded-xl border border-linha bg-azul-profundo p-6 transition-colors hover:border-ciano"
                >
                  <h3 className="text-xl font-semibold text-gelo group-hover:text-ciano">{dados.titulo}</h3>
                  <p className="mt-2 text-cinza-azulado">{dados.resumo}</p>
                  <span className="mt-4 inline-block text-sm font-medium text-ciano" aria-hidden>
                    Saiba mais →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section aria-labelledby="titulo-etapas" className="border-t border-linha">
        <div className="container-site py-16">
          <h2 id="titulo-etapas" className="text-2xl font-bold sm:text-3xl">
            Como funciona
          </h2>
          <ol className="mt-8 grid gap-6 sm:grid-cols-3">
            {etapas.map((etapa, i) => (
              <li key={etapa.titulo} className="space-y-2">
                <span className="font-titulo text-3xl font-bold text-ciano" aria-hidden>
                  {i + 1}
                </span>
                <h3 className="text-lg font-semibold">{etapa.titulo}</h3>
                <p className="text-cinza-azulado">{etapa.texto}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="cases" aria-labelledby="titulo-cases" className="border-t border-linha">
        <div className="container-site py-16">
          <h2 id="titulo-cases" className="text-2xl font-bold sm:text-3xl">
            Cases
          </h2>
          <ul className="mt-8 grid gap-4 sm:grid-cols-2">
            {cases.map(({ slug, dados }) => (
              <li key={slug}>
                <Link
                  href={`/cases/${slug}`}
                  className="group block h-full rounded-xl border border-linha bg-azul-profundo p-6 transition-colors hover:border-ciano"
                >
                  <p className="text-sm text-cinza-azulado">
                    {dados.setor} · {ROTULOS_SERVICO[dados.servico]}
                  </p>
                  <h3 className="mt-2 text-xl font-semibold text-gelo group-hover:text-ciano">{dados.titulo}</h3>
                  <p className="mt-2 text-cinza-azulado">{dados.resultado}</p>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <ChamadaDiagnostico />
    </>
  );
}
