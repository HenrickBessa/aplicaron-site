import Link from "next/link";
import { chamadaPrincipal, navegacao } from "@/conteudo/site";
import { BotaoLink } from "@/componentes/ui/Botao";
import { Logotipo } from "./Logotipo";
import { MenuMovel } from "./MenuMovel";

// Cabeçalho fixo no topo (sticky). Server Component; só o MenuMovel roda no navegador.
export function Cabecalho() {
  return (
    <header className="sticky top-0 z-50 border-b border-linha bg-azul-noite/95 backdrop-blur">
      <div className="container-site relative flex h-cabecalho items-center justify-between gap-4">
        {/* Primeira imagem da página: carrega com prioridade (melhora o LCP). */}
        <Link href="/" className="flex shrink-0 items-center rounded-sm" aria-label="AplicarOn, página inicial">
          <Logotipo altura={30} prioridade />
        </Link>

        <nav aria-label="Principal" className="hidden md:block">
          <ul className="flex items-center gap-6">
            {navegacao.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="rounded-sm px-1 py-2 text-gelo hover:text-ciano">
                  {item.rotulo}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="hidden md:block">
          <BotaoLink href={chamadaPrincipal.href}>{chamadaPrincipal.rotulo}</BotaoLink>
        </div>

        <MenuMovel />
      </div>
    </header>
  );
}
