import type { MDXComponents } from "mdx/types";
import Link from "next/link";
import type { ComponentProps } from "react";

// Obrigatório para o @next/mdx no App Router. Define como cada elemento do Markdown
// vira HTML com as nossas classes. Assim não precisamos do plugin de tipografia.
const componentes: MDXComponents = {
  // A página já tem o h1 (vindo de `dados.titulo`). Um "# Título" no MDX vira h2,
  // para garantir um único h1 por página.
  h1: (props) => <h2 className="mt-12 mb-4 text-2xl font-bold sm:text-3xl" {...props} />,
  h2: (props) => <h2 className="mt-12 mb-4 text-2xl font-bold sm:text-3xl" {...props} />,
  h3: (props) => <h3 className="mt-8 mb-3 text-xl font-semibold" {...props} />,
  p: (props) => <p className="my-4 leading-relaxed text-cinza-azulado" {...props} />,
  ul: (props) => <ul className="my-4 list-disc space-y-2 pl-6 text-cinza-azulado marker:text-ciano" {...props} />,
  ol: (props) => <ol className="my-4 list-decimal space-y-2 pl-6 text-cinza-azulado marker:text-ciano" {...props} />,
  strong: (props) => <strong className="font-semibold text-gelo" {...props} />,
  // Links internos usam next/link (navegação sem recarregar); externos abrem em nova aba.
  a: ({ href = "", children, ...props }: ComponentProps<"a">) =>
    href.startsWith("/") || href.startsWith("#") ? (
      <Link href={href} className="text-ciano underline underline-offset-2 hover:text-gelo" {...props}>
        {children}
      </Link>
    ) : (
      <a href={href} target="_blank" rel="noopener noreferrer" className="text-ciano underline underline-offset-2 hover:text-gelo" {...props}>
        {children}
        <span className="sr-only"> (abre em nova aba)</span>
      </a>
    ),
};

export function useMDXComponents(): MDXComponents {
  return componentes;
}
