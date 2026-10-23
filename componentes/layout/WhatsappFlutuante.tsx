"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { linkWhatsappComMensagem } from "@/conteudo/site";

// Só o ícone do WhatsApp (Simple Icons, o mesmo de conteudo/icones-tecnologias.gerado.ts). Importar o mapa
// inteiro de ícones aqui levaria os ~25 KB dele para o JavaScript de todas as páginas.
const ICONE_WHATSAPP = "M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z";

// Botão flutuante do WhatsApp + balão de boas-vindas ("Vamos criar o seu sonho!!").
//
// Balão:
// - aparece uma vez ao entrar no site, 1,5 s depois de a página abrir;
// - não volta ao navegar entre páginas (esta variável vive enquanto a aba não recarrega);
// - volta se a página for recarregada (F5), porque aí o JavaScript começa do zero;
// - é um balão no canto, não uma janela no meio da tela: o Google penaliza no ranking
//   pop-ups que cobrem o conteúdo na entrada ("intersticiais intrusivos");
// - não rouba o foco nem bloqueia a página (não é modal); fecha no × ou com Esc;
// - não aparece no diagnóstico nem no obrigado, para não atrapalhar quem preenche ou já enviou.
let balaoJaMostrado = false;
const SEM_BALAO = ["/diagnostico", "/obrigado"];
const ATRASO_MS = 1_500;

export function WhatsappFlutuante() {
  const caminho = usePathname();
  const [balaoAberto, setBalaoAberto] = useState(false);

  useEffect(() => {
    if (balaoJaMostrado || SEM_BALAO.includes(caminho)) return;
    const temporizador = setTimeout(() => {
      balaoJaMostrado = true;
      setBalaoAberto(true);
    }, ATRASO_MS);
    return () => clearTimeout(temporizador);
  }, [caminho]);

  useEffect(() => {
    if (!balaoAberto) return;
    const aoTeclar = (e: KeyboardEvent) => e.key === "Escape" && setBalaoAberto(false);
    document.addEventListener("keydown", aoTeclar);
    return () => document.removeEventListener("keydown", aoTeclar);
  }, [balaoAberto]);

  return (
    <div className="fixed right-4 bottom-4 z-40 flex flex-col items-end sm:right-6 sm:bottom-6">
      {/* Região anunciada pelo leitor de tela quando o balão aparece (sem mover o foco).
          Absoluta, acima do botão: o balão não muda o tamanho da caixa fixa, então não conta como layout shift (CLS). */}
      <div aria-live="polite" className="absolute right-0 bottom-full mb-3">
        {balaoAberto && (
          <div
            role="dialog"
            aria-modal="false"
            aria-labelledby="balao-whatsapp-titulo"
            className="balao-entrada relative w-72 max-w-[calc(100vw-2rem)] rounded-2xl border border-ciano/40 bg-azul-profundo p-5 pr-10 shadow-[0_20px_60px_-15px_var(--color-ciano)]"
          >
            <button
              type="button"
              onClick={() => setBalaoAberto(false)}
              aria-label="Fechar mensagem"
              className="absolute top-2 right-2 inline-flex size-8 items-center justify-center rounded-full text-cinza-azulado hover:bg-azul-noite hover:text-gelo"
            >
              <span aria-hidden className="text-lg leading-none">
                ×
              </span>
            </button>
            <p id="balao-whatsapp-titulo" className="font-titulo text-xl font-bold text-gelo">
              Vamos criar o seu sonho!!
            </p>
            <p className="mt-1 text-sm text-cinza-azulado">Conte sua ideia e receba uma resposta pelo WhatsApp.</p>
            <a
              href={linkWhatsappComMensagem}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setBalaoAberto(false)}
              className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#25d366] px-4 font-semibold text-azul-noite transition-transform hover:scale-105"
            >
              Conversar agora
              <span className="sr-only"> no WhatsApp (abre em nova aba)</span>
            </a>
            {/* Setinha apontando para o botão. */}
            <span
              aria-hidden
              className="absolute -bottom-2 right-6 size-4 rotate-45 border-r border-b border-ciano/40 bg-azul-profundo"
            />
          </div>
        )}
      </div>

      <a
        href={linkWhatsappComMensagem}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Fale com a AplicarOn no WhatsApp (abre em nova aba)"
        className="whatsapp-flutuante group relative inline-flex items-center gap-0 rounded-full bg-[#25d366] p-3.5 text-azul-noite shadow-[0_10px_25px_-5px_rgb(0_0_0/0.5)]"
      >
        {/* Anel que pulsa algumas vezes ao entrar (para depois: nada fica piscando sem parar). */}
        <span aria-hidden className="whatsapp-pulso absolute inset-0 rounded-full bg-[#25d366]" />
        {/* Ícone branco, como na marca oficial do WhatsApp. Valor explícito: o tema não tem a cor "white" (removemos a paleta padrão do Tailwind). */}
        <svg aria-hidden viewBox="0 0 24 24" className="whatsapp-icone relative size-7 fill-[#ffffff]">
          <path d={ICONE_WHATSAPP} />
        </svg>
        {/* Rótulo que desliza para fora no hover/foco (telas maiores). */}
        <span
          aria-hidden
          className="relative max-w-0 overflow-hidden font-semibold whitespace-nowrap transition-all duration-300 group-hover:ml-2 group-hover:max-w-40 group-focus-visible:ml-2 group-focus-visible:max-w-40"
        >
          Fale conosco
        </span>
      </a>
    </div>
  );
}
