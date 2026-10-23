import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { CarrosselTecnologias } from "@/componentes/conteudo/CarrosselTecnologias";
import { CartaoCliente } from "@/componentes/conteudo/CartaoCliente";
import { CartaoPlano } from "@/componentes/conteudo/CartaoPlano";
import { ChamadaDiagnostico } from "@/componentes/conteudo/ChamadaDiagnostico";
import { JsonLd } from "@/componentes/seo/JsonLd";
import { BotaoLink } from "@/componentes/ui/Botao";
import { IconeServico } from "@/componentes/ui/IconeServico";
import { Revelar } from "@/componentes/ui/Revelar";
import { clientes } from "@/conteudo/clientes";
import { planos } from "@/conteudo/planos";
import { servicos } from "@/conteudo/servicos";
import { chamadaPrincipal, site, URL_SITE } from "@/conteudo/site";
import { metadadosPagina, urlAbsoluta } from "@/lib/seo";
import type { Servico } from "@/lib/validacao/enums";
import ilustracao from "@/public/imagens/marca/ilustracao.webp";

export const metadata: Metadata = metadadosPagina({
  titulo: `Sites, agenda e cobrança no WhatsApp · ${site.nome}`,
  descricao:
    "Pacotes com implantação e mensalidade: site, agendamento com lembrete no WhatsApp e cobrança automática. Sob medida quando o seu negócio precisa.",
  caminho: "/",
  tituloCompleto: true,
});

// Organization: quem é a empresa (nome, logo, contato). WebSite: ajuda o Google a exibir
// "AplicarOn" como nome do site nos resultados, em vez da URL.
const dadosEstruturados = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${URL_SITE}/#organizacao`,
      name: site.nome,
      url: urlAbsoluta("/"),
      // Logo quadrado, 192px (o Google pede no mínimo 112px).
      logo: urlAbsoluta("/icon.png"),
      description: site.slogan,
      email: site.email,
      contactPoint: {
        "@type": "ContactPoint",
        contactType: "customer service",
        email: site.email,
        telephone: site.whatsapp,
        areaServed: "BR",
        availableLanguage: "Portuguese",
      },
    },
    {
      "@type": "WebSite",
      "@id": `${URL_SITE}/#site`,
      name: site.nome,
      url: urlAbsoluta("/"),
      inLanguage: "pt-BR",
      publisher: { "@id": `${URL_SITE}/#organizacao` },
    },
  ],
};

const etapas = [
  { titulo: "Diagnóstico", texto: "Você conta o desafio em 3 etapas rápidas. Entendemos o problema antes de falar em tecnologia." },
  { titulo: "Proposta", texto: "Escopo, prazo e investimento claros, com entregas em etapas que você acompanha de perto." },
  { titulo: "Entrega", texto: "Projeto publicado, testado e documentado. O código, os dados e o conhecimento ficam com você." },
];

// Porta de entrada de cada serviço: os planos daquele serviço ou, sem plano, o diagnóstico (projeto sob medida).
function EntradaServico({ servico }: { servico: Servico }) {
  const doServico = planos.filter((p) => p.servico === servico);
  const classeLink = "relative z-10 inline-flex min-h-6 items-center font-medium text-ciano underline underline-offset-4";
  return (
    <p className="text-sm text-cinza-azulado">
      {doServico.length > 0 ? (
        <>
          {doServico.length > 1 ? "Planos: " : "Plano: "}
          {doServico.map((plano, i) => (
            <span key={plano.slug}>
              {i > 0 && " e "}
              <Link href={plano.pagina ?? "/planos"} className={classeLink}>
                {plano.nome}
              </Link>
            </span>
          ))}
        </>
      ) : (
        <>
          Sob medida:{" "}
          <Link href={`/diagnostico?servico=${servico}`} className={classeLink}>
            diagnóstico gratuito
          </Link>
        </>
      )}
    </p>
  );
}

export default function Inicio() {
  return (
    <>
      <JsonLd dados={dadosEstruturados} />

      {/* Abertura */}
      <section className="container-site grid items-center gap-10 py-14 sm:py-20 md:grid-cols-2">
        <div className="space-y-6">
          <p className="text-sm font-semibold tracking-widest text-ciano uppercase">Planos prontos e projetos sob medida</p>
          {/* Sem lg:text-6xl: a frase é longa e empurraria os botões para fora da primeira tela. */}
          <h1 className="text-4xl leading-tight font-bold sm:text-5xl">
            Pacotes prontos para começar em dias —{" "}
            <span className="bg-linear-to-r from-ciano to-gelo bg-clip-text text-transparent">
              e sob medida quando o seu negócio precisa
            </span>
          </h1>
          {/* SEO: os termos de busca (site, agendamento, cobrança, WhatsApp) ficam logo abaixo do H1. */}
          <p className="max-w-xl text-lg text-cinza-azulado">
            Site que traz contato pelo WhatsApp, agendamento com lembrete e cobrança automática, com implantação de preço
            fechado e mensalidade fixa. Para o projeto maior, o diagnóstico gratuito é o primeiro passo.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <BotaoLink href="/planos">Ver os planos</BotaoLink>
            <BotaoLink href={chamadaPrincipal.href} variante="secundario">
              {chamadaPrincipal.rotulo}
            </BotaoLink>
          </div>
        </div>
        <div className="relative">
          {/* Brilho atrás da ilustração. */}
          <div aria-hidden className="absolute inset-[10%] -z-10 rounded-full bg-ciano/20 blur-3xl" />
          {/* Decorativa: a mensagem está no texto ao lado. priority = imagem principal (LCP) no desktop. */}
          <Image
            src={ilustracao}
            alt=""
            priority
            sizes="(min-width: 768px) 50vw, 100vw"
            // Máscara radial: as bordas da imagem somem no fundo, sem "moldura" retangular.
            className="flutuar h-auto w-full [mask-image:radial-gradient(ellipse_at_center,black_60%,transparent_78%)]"
          />
        </div>
      </section>

      {/* Serviços */}
      <section id="servicos" aria-labelledby="titulo-servicos" className="border-t border-linha">
        <div className="container-site py-16 sm:py-20">
          <Revelar className="max-w-2xl space-y-3">
            <p className="text-sm font-semibold tracking-widest text-ciano uppercase">O que fazemos</p>
            <h2 id="titulo-servicos" className="text-3xl font-bold sm:text-4xl">
              Soluções completas para o seu negócio
            </h2>
            <p className="text-cinza-azulado">
              Do site que atrai clientes ao sistema que organiza a operação: comece por um plano pronto ou peça um projeto sob
              medida.
            </p>
          </Revelar>
          <ul className="mt-10 grid gap-6 sm:grid-cols-2">
            {servicos.map(({ slug, dados }) => (
              <li key={slug}>
                <Revelar className="h-full">
                  {/* O link do título cobre o cartão (after:inset-0); os links de plano ficam por cima (z-10). Link dentro de link não vale. */}
                  <div className="cartao-interativo group relative flex h-full flex-col gap-4 rounded-xl border border-linha bg-azul-profundo p-6 sm:p-8">
                    <IconeServico servico={dados.servico} />
                    <h3 className="text-xl font-semibold text-gelo group-hover:text-ciano">
                      <Link href={`/servicos/${slug}`} className="after:absolute after:inset-0 after:rounded-xl">
                        {dados.titulo}
                      </Link>
                    </h3>
                    <p className="text-cinza-azulado">{dados.resumo}</p>
                    <ul className="mt-auto space-y-2 pt-2 text-sm text-gelo">
                      {dados.destaques.map((d) => (
                        <li key={d} className="flex items-center gap-2">
                          <span aria-hidden className="text-ciano">
                            ✓
                          </span>
                          {d}
                        </li>
                      ))}
                    </ul>
                    <EntradaServico servico={dados.servico} />
                    <span className="text-sm font-medium text-ciano" aria-hidden>
                      Saiba mais{" "}
                      <span className="inline-block transition-transform motion-safe:group-hover:translate-x-1">→</span>
                    </span>
                  </div>
                </Revelar>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Planos */}
      <section id="planos" aria-labelledby="titulo-planos" className="border-t border-linha">
        <div className="container-site py-16 sm:py-20">
          <Revelar className="flex flex-wrap items-end justify-between gap-4">
            <div className="max-w-2xl space-y-3">
              <p className="text-sm font-semibold tracking-widest text-ciano uppercase">Planos</p>
              <h2 id="titulo-planos" className="text-3xl font-bold sm:text-4xl">
                Pacotes prontos, com preço e prazo na mesa
              </h2>
              <p className="text-cinza-azulado">Implantação com valor fechado e mensalidade fixa.</p>
            </div>
            <Link href="/planos" className="font-medium text-ciano underline-offset-4 hover:underline">
              Ver todos os detalhes →
            </Link>
          </Revelar>
          <ul className="mt-10 grid gap-6 lg:grid-cols-3">
            {planos.map((plano) => (
              <li key={plano.slug}>
                <Revelar className="h-full">
                  <CartaoPlano plano={plano} hrefAcao={`/planos#quero-${plano.slug}`} resumido />
                </Revelar>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Como funciona */}
      <section aria-labelledby="titulo-etapas" className="border-t border-linha">
        <div className="container-site py-16 sm:py-20">
          <Revelar className="max-w-2xl space-y-3">
            <p className="text-sm font-semibold tracking-widest text-ciano uppercase">Projeto sob medida</p>
            <h2 id="titulo-etapas" className="text-3xl font-bold sm:text-4xl">
              Do primeiro contato à entrega
            </h2>
          </Revelar>
          <ol className="mt-10 grid gap-6 sm:grid-cols-3">
            {etapas.map((etapa, i) => (
              <li key={etapa.titulo}>
                <Revelar className="h-full space-y-3 rounded-xl border border-linha bg-azul-profundo/60 p-6">
                  <span
                    aria-hidden
                    className="inline-flex size-11 items-center justify-center rounded-full border border-ciano/40 font-titulo text-lg font-bold text-ciano"
                  >
                    {i + 1}
                  </span>
                  <h3 className="text-lg font-semibold">{etapa.titulo}</h3>
                  <p className="text-cinza-azulado">{etapa.texto}</p>
                </Revelar>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Clientes */}
      <section id="clientes" aria-labelledby="titulo-clientes" className="border-t border-linha">
        <div className="container-site py-16 sm:py-20">
          <Revelar className="flex flex-wrap items-end justify-between gap-4">
            <div className="max-w-2xl space-y-3">
              <p className="text-sm font-semibold tracking-widest text-ciano uppercase">Clientes</p>
              <h2 id="titulo-clientes" className="text-3xl font-bold sm:text-4xl">
                Empresas que confiam na AplicarOn
              </h2>
              <p className="text-cinza-azulado">Uma seleção dos projetos que entregamos.</p>
            </div>
            <Link href="/clientes" className="font-medium text-ciano underline-offset-4 hover:underline">
              Conhecer os projetos →
            </Link>
          </Revelar>
          <ul className="mt-10 grid gap-6 sm:grid-cols-2">
            {clientes.map((cliente) => (
              <li key={cliente.slug}>
                <Revelar className="h-full">
                  <CartaoCliente cliente={cliente} />
                </Revelar>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Tecnologias */}
      <section aria-labelledby="titulo-tecnologias" className="border-t border-linha">
        <div className="container-site py-16 sm:py-20">
          <Revelar className="mx-auto max-w-2xl space-y-3 text-center">
            <p className="text-sm font-semibold tracking-widest text-ciano uppercase">Tecnologias</p>
            <h2 id="titulo-tecnologias" className="text-3xl font-bold sm:text-4xl">
              Ferramentas modernas, resultado sólido
            </h2>
            <p className="text-cinza-azulado">As linguagens, frameworks e plataformas com que construímos cada projeto.</p>
          </Revelar>
        </div>
        <div className="pb-16 sm:pb-20">
          <CarrosselTecnologias />
        </div>
      </section>

      <ChamadaDiagnostico />
    </>
  );
}
