import { Botao, BotaoLink } from "@/componentes/ui/Botao";
import { CaixaSelecao, CampoAreaTexto, CampoTexto, GrupoOpcoes } from "@/componentes/ui/campos";
import { chamadaPrincipal } from "@/conteudo/site";

// RASCUNHO: home provisória da fatia 2. Mostra os componentes do design system para
// conferência visual e de teclado. É substituída pela home real (MDX) na fatia 3.
export default function Inicio() {
  return (
    <>
      <section className="container-site py-16 sm:py-24">
        <p className="text-sm font-semibold tracking-wide text-ciano uppercase">RASCUNHO</p>
        <h1 className="mt-3 max-w-3xl text-4xl font-bold sm:text-5xl">
          Tecnologia sob medida para o seu negócio crescer
        </h1>
        <p className="mt-5 max-w-2xl text-lg text-cinza-azulado">
          Sites, sistemas, aplicativos e automação com IA. Texto provisório para validar tipografia e cores.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <BotaoLink href={chamadaPrincipal.href}>{chamadaPrincipal.rotulo}</BotaoLink>
          <BotaoLink href="/#servicos" variante="secundario">
            Ver serviços
          </BotaoLink>
        </div>
      </section>

      <section id="servicos" className="border-t border-linha">
        <div className="container-site py-16">
          <h2 className="text-2xl font-bold sm:text-3xl">Prévia dos componentes</h2>
          <p className="mt-2 text-cinza-azulado">Só para conferência na fatia 2. Nada aqui é enviado.</p>

          <form className="mt-8 max-w-2xl space-y-6 rounded-xl bg-azul-profundo p-6 sm:p-8" noValidate>
            <GrupoOpcoes
              id="previa-servico"
              name="servico"
              legenda="Qual serviço você procura?"
              valorPadrao="sites"
              opcoes={[
                { valor: "sites", rotulo: "Sites", descricao: "Institucionais e landing pages" },
                { valor: "sistemas", rotulo: "Sistemas", descricao: "Painéis e sistemas internos" },
              ]}
            />
            <CampoTexto id="previa-nome" name="nome" rotulo="Nome" autoComplete="name" />
            <CampoTexto
              id="previa-email"
              name="email"
              type="email"
              rotulo="E-mail"
              autoComplete="email"
              defaultValue="email-invalido"
              erro="Informe um e-mail válido, como nome@empresa.com.br."
            />
            <CampoTexto
              id="previa-whatsapp"
              name="whatsapp"
              type="tel"
              rotulo="WhatsApp"
              autoComplete="tel"
              opcional
              dica="Com DDD. Ex.: (11) 98765-4321"
            />
            <CampoAreaTexto id="previa-descricao" name="descricao" rotulo="Conte sobre o projeto" />
            <CaixaSelecao
              id="previa-marketing"
              name="marketing"
              rotulo="Quero receber novidades da AplicarOn por e-mail"
              dica="Opcional. Você pode cancelar quando quiser."
            />
            <div className="flex flex-wrap gap-3">
              <Botao>Botão primário</Botao>
              <Botao variante="secundario">Botão secundário</Botao>
              <Botao disabled>Desabilitado</Botao>
            </div>
          </form>
        </div>
      </section>

      <section id="cases" className="border-t border-linha">
        <div className="container-site py-16">
          <h2 className="text-2xl font-bold sm:text-3xl">Cases</h2>
          <p className="mt-2 text-cinza-azulado">Conteúdo na fatia 3.</p>
        </div>
      </section>
    </>
  );
}
