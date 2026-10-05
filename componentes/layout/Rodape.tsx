import Link from "next/link";
import { linkWhatsapp, navegacao, site } from "@/conteudo/site";

export function Rodape() {
  // Páginas estáticas: o ano é fixado no build. Um novo deploy por ano basta.
  const ano = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-linha bg-azul-profundo">
      <div className="container-site grid gap-8 py-10 sm:grid-cols-3">
        <div className="space-y-2">
          <p className="font-titulo text-lg font-bold text-gelo">
            Aplicar<span className="text-ciano">On</span>
          </p>
          <p className="text-sm text-cinza-azulado">{site.slogan}</p>
        </div>

        <nav aria-label="Rodapé">
          <h2 className="mb-3 text-sm font-semibold text-gelo">Navegação</h2>
          <ul className="space-y-1 text-sm">
            {[...navegacao, { href: "/diagnostico", rotulo: "Diagnóstico" }, { href: "/privacidade", rotulo: "Privacidade" }].map(
              (item) => (
                <li key={item.href}>
                  <Link href={item.href} className="inline-flex min-h-6 items-center text-cinza-azulado hover:text-ciano">
                    {item.rotulo}
                  </Link>
                </li>
              ),
            )}
          </ul>
        </nav>

        <div>
          <h2 className="mb-3 text-sm font-semibold text-gelo">Contato</h2>
          <ul className="space-y-1 text-sm">
            <li>
              <a href={`mailto:${site.email}`} className="inline-flex min-h-6 items-center text-cinza-azulado hover:text-ciano">
                {site.email}
              </a>
            </li>
            <li>
              <a
                href={linkWhatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-6 items-center text-cinza-azulado hover:text-ciano"
              >
                WhatsApp<span className="sr-only"> (abre em nova aba)</span>
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-linha">
        <p className="container-site py-4 text-xs text-cinza-azulado">
          © {ano} {site.nome}. Todos os direitos reservados.
        </p>
      </div>
    </footer>
  );
}
