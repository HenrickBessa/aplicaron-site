"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ICONES } from "@/conteudo/icones-tecnologias.gerado";
import { linkWhatsappComMensagem } from "@/conteudo/site";

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
    <div className="fixed right-4 bottom-4 z-40 flex flex-col items-end gap-3 sm:right-6 sm:bottom-6">
      {/* Região anunciada pelo leitor de tela quando o balão aparece (sem mover o foco). */}
      <div aria-live="polite">
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
          <path d={ICONES.whatsapp.path} />
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
