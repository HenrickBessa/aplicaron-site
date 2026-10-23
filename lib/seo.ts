import type { Metadata } from "next";
import type { DadosPlano } from "@/conteudo/planos";
import { site, URL_SITE } from "@/conteudo/site";

// Metadados de uma página indexável. Centraliza duas armadilhas do Next:
// 1. canonical por página: se ficasse no layout raiz, toda página sem canonical própria
//    herdaria a da home e o Google trataria todas como duplicatas dela;
// 2. openGraph de uma página SUBSTITUI o do layout (não mescla): siteName, locale e type
//    precisam ser repetidos aqui.
export function metadadosPagina({
  titulo,
  descricao,
  caminho,
  tituloCompleto = false,
}: {
  titulo: string;
  descricao: string;
  caminho: string; // ex.: "/servicos/sites"
  tituloCompleto?: boolean; // true = não aplica o template "%s · AplicarOn" (usado na home)
}): Metadata {
  const tituloSocial = tituloCompleto ? titulo : `${titulo} · ${site.nome}`;
  return {
    title: tituloCompleto ? { absolute: titulo } : titulo,
    description: descricao,
    alternates: { canonical: caminho },
    openGraph: {
      type: "website",
      locale: "pt_BR",
      siteName: site.nome,
      url: caminho,
      title: tituloSocial,
      description: descricao,
      // 3. Ao definir openGraph, a página PERDE a imagem herdada do layout (achado pelos
      //    testes de SEO). Por isso a imagem é declarada aqui também.
      images: [IMAGEM_SOCIAL],
    },
    twitter: { card: "summary_large_image", title: tituloSocial, description: descricao, images: [IMAGEM_SOCIAL] },
  };
}

// Gerada por scripts/otimizar-imagens.mjs a partir da ilustração da marca.
export const IMAGEM_SOCIAL = {
  url: "/og.jpg",
  width: 1200,
  height: 630,
  alt: `${site.nome}: ${site.slogan}`,
  type: "image/jpeg",
};

// <script type="application/ld+json"> seguro: troca "<" pelo escape unicode (u003c) para um texto vindo do
// conteúdo nunca conseguir fechar a tag e injetar HTML (recomendação da documentação do Next).
export function serializarJsonLd(dados: object) {
  return JSON.stringify(dados).replace(/</g, "\\u003c");
}

export function urlAbsoluta(caminho: string) {
  return `${URL_SITE}${caminho.startsWith("/") ? caminho : `/${caminho}`}`;
}

// Mesmo @id da Organization publicada na home: o Google liga serviço e oferta à empresa.
const ORGANIZACAO = { "@id": `${URL_SITE}/#organizacao` };

// Oferta de um plano com os dois preços visíveis no cartão: implantação "a partir de" e mensalidade.
// O preço do JSON-LD precisa ser o mesmo da página; por isso sai de conteudo/planos.ts.
export function ofertaPlano(plano: DadosPlano, caminho: string) {
  return {
    "@type": "Offer",
    url: urlAbsoluta(caminho),
    priceCurrency: "BRL",
    seller: ORGANIZACAO,
    priceSpecification: [
      { "@type": "PriceSpecification", name: "Implantação", minPrice: plano.implantacao, priceCurrency: "BRL" },
      {
        "@type": "UnitPriceSpecification",
        name: "Mensalidade",
        price: plano.mensalidade,
        priceCurrency: "BRL",
        referenceQuantity: { "@type": "QuantitativeValue", value: 1, unitCode: "MON" },
      },
    ],
  };
}

export function dadosServico({ nome, descricao, caminho }: { nome: string; descricao: string; caminho: string }) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: nome,
    description: descricao,
    url: urlAbsoluta(caminho),
    provider: ORGANIZACAO,
    areaServed: "BR",
  };
}

export function catalogoPlanos(planos: DadosPlano[]) {
  return {
    "@context": "https://schema.org",
    "@type": "OfferCatalog",
    name: `Planos ${site.nome}`,
    url: urlAbsoluta("/planos"),
    itemListElement: planos.map((plano) => ({
      ...ofertaPlano(plano, "/planos"),
      itemOffered: { "@type": "Service", name: plano.nome, description: plano.resumo, provider: ORGANIZACAO },
    })),
  };
}

export function dadosProduto({ nome, descricao, caminho, plano }: { nome: string; descricao: string; caminho: string; plano?: DadosPlano }) {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: nome,
    description: descricao,
    url: urlAbsoluta(caminho),
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    publisher: ORGANIZACAO,
    // Sem plano (produto em desenvolvimento) não há oferta: nunca marcar preço que não existe.
    ...(plano && { offers: ofertaPlano(plano, caminho) }),
  };
}
