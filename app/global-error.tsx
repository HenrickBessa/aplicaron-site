"use client"; // Error boundaries precisam ser Client Components.

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";
import "./globals.css";

// Último recurso: substitui o layout raiz quando ele próprio falha. Por isso
// precisa ter <html> e <body> e importar o CSS; as fontes caem no fallback do sistema.
export default function ErroGlobal({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  // A boundary "engole" o erro: sem isto, ele não chegaria ao Sentry.
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="pt-BR">
      <body className="flex min-h-dvh items-center justify-center p-4">
        <title>Erro · AplicarOn</title>
        <main className="max-w-md space-y-4 text-center">
          <h1 className="text-3xl font-bold">Algo deu errado</h1>
          <p className="text-cinza-azulado">Recarregue a página ou tente novamente em instantes.</p>
          <button
            type="button"
            onClick={() => retry()}
            className="inline-flex min-h-11 items-center rounded-lg bg-ciano px-5 font-semibold text-azul-noite"
          >
            Tentar de novo
          </button>
          {error.digest && <p className="text-xs text-cinza-azulado">Código: {error.digest}</p>}
        </main>
      </body>
    </html>
  );
}
