import type { ReactNode } from "react";
import { Cabecalho } from "./Cabecalho";
import { Rodape } from "./Rodape";

// Usada pelo layout de app/(site) e pelo app/not-found.tsx (URLs inexistentes ficam
// fora do grupo (site), mas devem ter o mesmo cabeçalho e rodapé).
export function EstruturaSite({ children }: { children: ReactNode }) {
  return (
    <>
      {/* Primeiro item focável da página: quem usa teclado pula a navegação (WCAG 2.4.1). */}
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[60] focus:rounded-lg focus:bg-ciano focus:px-4 focus:py-2 focus:font-semibold focus:text-azul-noite"
      >
        Pular para o conteúdo
      </a>
      <Cabecalho />
      {/* tabIndex -1 permite que o link acima mova o foco para cá. */}
      <main id="conteudo" tabIndex={-1} className="flex-1 focus:outline-none">
        {children}
      </main>
      <Rodape />
    </>
  );
}
