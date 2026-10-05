import Link from "next/link";
import type { ReactNode } from "react";

export type ItemTrilha = { href?: string; rotulo: string };

// Trilha de navegação visível ("Início › Serviços › Sites").
// O JSON-LD BreadcrumbList equivalente entra na fatia 6.
function Trilha({ itens }: { itens: ItemTrilha[] }) {
  return (
    <nav aria-label="Trilha de navegação" className="text-sm">
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-cinza-azulado">
        {itens.map((item, i) => (
          <li key={item.rotulo} className="flex items-center gap-2">
            {i > 0 && <span aria-hidden>›</span>}
            {item.href ? (
              <Link href={item.href} className="inline-flex min-h-6 items-center rounded-sm hover:text-ciano">
                {item.rotulo}
              </Link>
            ) : (
              <span aria-current="page" className="text-gelo">
                {item.rotulo}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

// Marca visível de conteúdo provisório. Some quando o MDX tiver `rascunho: false`.
export function SeloRascunho() {
  return (
    <p className="inline-flex rounded-full border border-ciano px-3 py-1 text-xs font-semibold tracking-wide text-ciano uppercase">
      Rascunho
    </p>
  );
}

type Props = {
  titulo: string;
  descricao?: string;
  rascunho?: boolean;
  trilha?: ItemTrilha[];
  children?: ReactNode;
};

// Topo padrão das páginas de conteúdo: trilha, selo, o único h1 da página e a descrição.
export function CabecalhoPagina({ titulo, descricao, rascunho, trilha, children }: Props) {
  return (
    <header className="border-b border-linha">
      <div className="container-site space-y-5 py-12 sm:py-16">
        {trilha && <Trilha itens={trilha} />}
        {rascunho && <SeloRascunho />}
        <h1 className="max-w-3xl text-3xl font-bold sm:text-5xl">{titulo}</h1>
        {descricao && <p className="max-w-2xl text-lg text-cinza-azulado">{descricao}</p>}
        {children}
      </div>
    </header>
  );
}
