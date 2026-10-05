import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CabecalhoPagina } from "@/componentes/conteudo/CabecalhoPagina";
import { ChamadaDiagnostico } from "@/componentes/conteudo/ChamadaDiagnostico";
import { BotaoLink } from "@/componentes/ui/Botao";
import { buscarServico, servicos } from "@/conteudo/servicos";

// Gera uma página estática por serviço no build.
export function generateStaticParams() {
  return servicos.map((s) => ({ slug: s.slug }));
}

// Qualquer slug fora da lista vira 404, sem tentar renderizar sob demanda.
export const dynamicParams = false;

export async function generateMetadata({ params }: PageProps<"/servicos/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const servico = buscarServico(slug);
  if (!servico) return {};
  return { title: servico.dados.titulo, description: servico.dados.descricao };
}

export default async function PaginaServico({ params }: PageProps<"/servicos/[slug]">) {
  const { slug } = await params;
  const servico = buscarServico(slug);
  if (!servico) notFound();

  const { dados, Conteudo } = servico;
  const linkDiagnostico = `/diagnostico?servico=${dados.servico}`;

  return (
    <>
      <CabecalhoPagina
        titulo={dados.titulo}
        descricao={dados.descricao}
        rascunho={dados.rascunho}
        trilha={[{ href: "/", rotulo: "Início" }, { href: "/#servicos", rotulo: "Serviços" }, { rotulo: dados.titulo }]}
      >
        <BotaoLink href={linkDiagnostico}>Pedir diagnóstico gratuito</BotaoLink>
      </CabecalhoPagina>
      <div className="container-site py-8 sm:py-12">
        <article className="max-w-3xl [&>:first-child]:mt-0">
          <Conteudo />
        </article>
      </div>
      <ChamadaDiagnostico servico={dados.servico} />
    </>
  );
}
