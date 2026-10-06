import type { Metadata } from "next";
import { CabecalhoPagina } from "@/componentes/conteudo/CabecalhoPagina";
import { politicaVigente } from "@/conteudo/privacidade";
import { metadadosPagina } from "@/lib/seo";

export const metadata: Metadata = metadadosPagina({
  titulo: "Política de privacidade",
  descricao: "Como a AplicarOn coleta, usa e protege os dados pessoais enviados pelo site, e como exercer seus direitos pela LGPD.",
  caminho: "/privacidade",
});

// "2026-10-05" -> "5 de outubro de 2026". Fuso fixo para o build não depender da máquina.
function formatarData(iso: string) {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "long", timeZone: "UTC" }).format(new Date(`${iso}T00:00:00Z`));
}

export default function PaginaPrivacidade() {
  const { dados, Conteudo } = politicaVigente;
  // "2026-10-06-2" -> "2026-10-06": o sufixo só diferencia versões do mesmo dia.
  const dataVigencia = dados.versao.slice(0, 10);
  return (
    <>
      <CabecalhoPagina
        titulo="Política de privacidade"
        rascunho={dados.rascunho}
        caminho="/privacidade"
        trilha={[{ href: "/", rotulo: "Início" }, { rotulo: "Privacidade" }]}
      >
        <p className="text-sm text-cinza-azulado">
          Versão vigente desde <time dateTime={dataVigencia}>{formatarData(dataVigencia)}</time>
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
