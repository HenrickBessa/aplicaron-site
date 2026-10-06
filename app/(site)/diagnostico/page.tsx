import type { Metadata } from "next";
import { CabecalhoPagina } from "@/componentes/conteudo/CabecalhoPagina";
import { metadadosPagina } from "@/lib/seo";
import { Formulario } from "./Formulario";

// canonical "/diagnostico": as variações ?servico=... são a mesma página para o Google.
export const metadata: Metadata = metadadosPagina({
  titulo: "Diagnóstico gratuito",
  descricao: "Conte sobre o seu projeto em 3 etapas rápidas e receba um diagnóstico gratuito da AplicarOn, sem compromisso.",
  caminho: "/diagnostico",
});

// Página estática: o ?servico= é lido no navegador pelo formulário, então a página
// não precisa ser renderizada a cada visita. Nenhum dado de lead passa por cache.
export default function PaginaDiagnostico() {
  return (
    <>
      <CabecalhoPagina
        titulo="Diagnóstico gratuito"
        descricao="Três etapas rápidas. Respondemos em até um dia útil, sem compromisso."
        caminho="/diagnostico"
        trilha={[{ href: "/", rotulo: "Início" }, { rotulo: "Diagnóstico" }]}
      />
      <div className="container-site py-8 sm:py-12">
        <div className="max-w-2xl">
          <Formulario />
        </div>
      </div>
    </>
  );
}
