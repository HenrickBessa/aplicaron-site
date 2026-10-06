import { serializarJsonLd } from "@/lib/seo";

// Dados estruturados (schema.org) para o Google entender a página além do texto.
// Validar em https://search.google.com/test/rich-results depois de publicar.
export function JsonLd({ dados }: { dados: object }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializarJsonLd(dados) }} />;
}
