"use client"; // Error boundaries precisam ser Client Components.

import { capturarErro } from "@/lib/sentry-cliente";
import { useEffect } from "react";
import { Botao, BotaoLink } from "@/componentes/ui/Botao";
import { linkWhatsapp } from "@/conteudo/site";

// Em produção, o Next substitui a mensagem de erros do servidor por um texto genérico
// e um `digest` (código para achar o erro nos logs). Mostramos só o código.
export default function ErroSite({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  // A boundary "engole" o erro: sem isto, ele não chegaria ao Sentry.
  useEffect(() => {
    capturarErro(error);
  }, [error]);

  return (
    <section className="container-site py-20 text-center sm:py-28">
      <h1 className="text-3xl font-bold sm:text-4xl">Algo deu errado</h1>
      <p className="mx-auto mt-4 max-w-md text-cinza-azulado">
        Tente de novo em instantes. Se o problema continuar, fale com a gente pelo{" "}
        <a href={linkWhatsapp} target="_blank" rel="noopener noreferrer" className="text-ciano underline">
          WhatsApp<span className="sr-only"> (abre em nova aba)</span>
        </a>
        .
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Botao onClick={() => retry()}>Tentar de novo</Botao>
        <BotaoLink href="/" variante="secundario">
          Voltar para o início
        </BotaoLink>
      </div>
      {error.digest && <p className="mt-6 text-xs text-cinza-azulado">Código: {error.digest}</p>}
    </section>
  );
}
