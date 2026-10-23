"use client"; // Error boundaries precisam ser Client Components.

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";
import { Botao } from "@/componentes/ui/Botao";

// Mostra só o código do erro (digest), que liga a tela ao log na Vercel e no Sentry.
export default function ErroAdmin({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <section>
      <h1 className="text-2xl font-bold">Algo deu errado</h1>
      <p className="mt-2 text-cinza-azulado">Tente de novo. Se continuar, procure o código abaixo nos logs.</p>
      {error.digest && <p className="mt-2 text-sm text-cinza-azulado">Código: {error.digest}</p>}
      <Botao className="mt-6" onClick={() => retry()}>
        Tentar de novo
      </Botao>
    </section>
  );
}
