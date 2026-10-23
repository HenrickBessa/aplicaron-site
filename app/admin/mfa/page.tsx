import type { Metadata } from "next";
import { exigirLoginParaMfa } from "@/lib/dal/admin";
import { FormularioMfa } from "./FormularioMfa";

export const metadata: Metadata = { title: "Código de acesso" };

export default async function PaginaMfa() {
  const { cadastrado } = await exigirLoginParaMfa();

  return (
    <section className="mx-auto max-w-sm">
      <h1 className="text-2xl font-bold">{cadastrado ? "Código de acesso" : "Cadastre o app autenticador"}</h1>
      <p className="mt-2 text-cinza-azulado">
        {cadastrado
          ? "Digite o código de 6 números que aparece no app autenticador."
          : "No primeiro acesso, ligue um app autenticador (Google Authenticator, Microsoft Authenticator ou similar) à sua conta."}
      </p>
      <FormularioMfa cadastrado={cadastrado} />
    </section>
  );
}
