import type { Metadata } from "next";
import { BotaoLink } from "@/componentes/ui/Botao";
import { linkWhatsapp } from "@/conteudo/site";

// noindex: a página só faz sentido depois de enviar o formulário. Não bloqueamos no
// robots.txt de propósito: se bloqueasse, o Google não leria o noindex e poderia
// indexar a URL mesmo assim (só que sem conteúdo).
export const metadata: Metadata = {
  title: "Recebemos seu pedido",
  description: "Recebemos seu pedido de diagnóstico. Em breve entraremos em contato.",
  robots: { index: false, follow: true },
};

export default function PaginaObrigado() {
  return (
    <section className="container-site py-20 text-center sm:py-28">
      <h1 className="text-3xl font-bold sm:text-4xl">Recebemos seu pedido</h1>
      <p className="mx-auto mt-4 max-w-md text-cinza-azulado">
        Obrigado por contar sobre o seu projeto. Vamos analisar e responder em até um dia útil pelo contato que você
        informou.
      </p>
      <p className="mx-auto mt-2 max-w-md text-cinza-azulado">
        Tem pressa? Fale com a gente pelo{" "}
        <a href={linkWhatsapp} target="_blank" rel="noopener noreferrer" className="text-ciano underline">
          WhatsApp<span className="sr-only"> (abre em nova aba)</span>
        </a>
        .
      </p>
      <div className="mt-8">
        <BotaoLink href="/" variante="secundario">
          Voltar para o início
        </BotaoLink>
      </div>
    </section>
  );
}
