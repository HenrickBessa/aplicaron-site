import { BotaoLink } from "@/componentes/ui/Botao";

export default function NaoEncontradoAdmin() {
  return (
    <section>
      <h1 className="text-2xl font-bold">Página não encontrada</h1>
      <BotaoLink href="/admin" className="mt-6">
        Voltar para os leads
      </BotaoLink>
    </section>
  );
}
