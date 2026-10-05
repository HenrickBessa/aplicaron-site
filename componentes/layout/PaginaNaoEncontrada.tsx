import { BotaoLink } from "@/componentes/ui/Botao";
import { chamadaPrincipal } from "@/conteudo/site";

export function PaginaNaoEncontrada() {
  return (
    <section className="container-site py-20 text-center sm:py-28">
      <p className="text-sm font-semibold tracking-wide text-ciano uppercase">Erro 404</p>
      <h1 className="mt-3 text-3xl font-bold sm:text-4xl">Página não encontrada</h1>
      <p className="mx-auto mt-4 max-w-md text-cinza-azulado">
        O endereço pode ter mudado ou não existe mais.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <BotaoLink href="/">Voltar para o início</BotaoLink>
        <BotaoLink href={chamadaPrincipal.href} variante="secundario">
          {chamadaPrincipal.rotulo}
        </BotaoLink>
      </div>
    </section>
  );
}
