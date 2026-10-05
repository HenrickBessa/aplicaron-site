import type { Metadata } from "next";
import { CabecalhoPagina } from "@/componentes/conteudo/CabecalhoPagina";
import { politicaVigente } from "@/conteudo/privacidade";

export const metadata: Metadata = {
  title: "Política de privacidade",
  description: "Como a AplicarOn coleta, usa e protege os dados pessoais enviados pelo site, e como exercer seus direitos pela LGPD.",
};

// "2026-10-05" -> "5 de outubro de 2026". Fuso fixo para o build não depender da máquina.
function formatarData(iso: string) {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "long", timeZone: "UTC" }).format(new Date(`${iso}T00:00:00Z`));
}

export default function PaginaPrivacidade() {
  const { dados, Conteudo } = politicaVigente;
  return (
    <>
      <CabecalhoPagina
        titulo="Política de privacidade"
        rascunho={dados.rascunho}
        trilha={[{ href: "/", rotulo: "Início" }, { rotulo: "Privacidade" }]}
      >
        <p className="text-sm text-cinza-azulado">
          Versão vigente desde <time dateTime={dados.versao}>{formatarData(dados.versao)}</time>
        </p>
      </CabecalhoPagina>
      <div className="container-site py-8 sm:py-12">
        <article className="max-w-3xl [&>:first-child]:mt-0">
          <Conteudo />
        </article>
      </div>
    </>
  );
}
