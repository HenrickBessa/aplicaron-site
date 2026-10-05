import type { Metadata } from "next";
import { CabecalhoPagina } from "@/componentes/conteudo/CabecalhoPagina";
import { ChamadaDiagnostico } from "@/componentes/conteudo/ChamadaDiagnostico";
import { carregar, dadosPaginaSchema } from "@/conteudo/esquemas";
import * as sobreMdx from "@/conteudo/sobre.mdx";

const sobre = carregar(dadosPaginaSchema, "sobre", sobreMdx);

export const metadata: Metadata = {
  title: sobre.dados.titulo,
  description: sobre.dados.descricao,
};

export default function PaginaSobre() {
  const { dados, Conteudo } = sobre;
  return (
    <>
      <CabecalhoPagina
        titulo={dados.titulo}
        descricao={dados.descricao}
        rascunho={dados.rascunho}
        trilha={[{ href: "/", rotulo: "Início" }, { rotulo: "Sobre" }]}
      />
      <div className="container-site py-8 sm:py-12">
        <article className="max-w-3xl [&>:first-child]:mt-0">
          <Conteudo />
        </article>
      </div>
      <ChamadaDiagnostico />
    </>
  );
}
