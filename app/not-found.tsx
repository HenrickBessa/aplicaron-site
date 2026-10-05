import type { Metadata } from "next";
import { EstruturaSite } from "@/componentes/layout/EstruturaSite";
import { PaginaNaoEncontrada } from "@/componentes/layout/PaginaNaoEncontrada";

export const metadata: Metadata = {
  title: "Página não encontrada",
  robots: { index: false },
};

// Usado para URLs que não correspondem a nenhuma rota. Fica fora do grupo (site),
// por isso monta o cabeçalho e o rodapé por conta própria.
export default function NaoEncontrado() {
  return (
    <EstruturaSite>
      <PaginaNaoEncontrada />
    </EstruturaSite>
  );
}
