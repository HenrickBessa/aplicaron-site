import Link from "next/link";
import { chamadaPrincipal, navegacao } from "@/conteudo/site";
import { BotaoLink } from "@/componentes/ui/Botao";
import { MenuMovel } from "./MenuMovel";

// Cabeçalho fixo no topo (sticky). Server Component; só o MenuMovel roda no navegador.
export function Cabecalho() {
  return (
    <header className="sticky top-0 z-50 border-b border-linha bg-azul-noite/95 backdrop-blur">
      <div className="container-site relative flex h-cabecalho items-center justify-between gap-4">
        <Link href="/" className="font-titulo text-xl font-bold tracking-tight text-gelo">
          Aplicar<span className="text-ciano">On</span>
          <span className="sr-only"> — página inicial</span>
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
