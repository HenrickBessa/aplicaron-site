import { PaginaNaoEncontrada } from "@/componentes/layout/PaginaNaoEncontrada";

// Usado quando uma página do grupo chama notFound() (ex.: slug de serviço inexistente).
export default function NaoEncontradoSite() {
  return <PaginaNaoEncontrada />;
}
