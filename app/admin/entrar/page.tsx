import type { Metadata } from "next";
import { FormularioEntrar } from "./FormularioEntrar";

export const metadata: Metadata = { title: "Entrar" };

export default function PaginaEntrar() {
  return (
    <section className="mx-auto max-w-sm">
      <h1 className="text-2xl font-bold">Entrar</h1>
      <p className="mt-2 text-cinza-azulado">Depois da senha, o app autenticador pede um código.</p>
      <FormularioEntrar />
    </section>
  );
}
