"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { chamadaPrincipal, navegacao } from "@/conteudo/site";
import { classesBotao } from "@/componentes/ui/Botao";
import { IconeFechar, IconeMenu } from "@/componentes/ui/icones";

// Único pedaço do layout que precisa de JavaScript: abrir e fechar o menu no celular.
export function MenuMovel() {
  const [aberto, setAberto] = useState(false);
  const botaoRef = useRef<HTMLButtonElement>(null);

  // Esc fecha o menu e devolve o foco ao botão, para quem navega por teclado não se perder.
  useEffect(() => {
    if (!aberto) return;
    function aoTeclar(evento: KeyboardEvent) {
      if (evento.key === "Escape") {
        setAberto(false);
        botaoRef.current?.focus();
      }
    }
    document.addEventListener("keydown", aoTeclar);
    return () => document.removeEventListener("keydown", aoTeclar);
  }, [aberto]);

  const fechar = () => setAberto(false);

  return (
    <div className="md:hidden">
      <button
        ref={botaoRef}
        type="button"
        aria-expanded={aberto}
        aria-controls="menu-movel"
        onClick={() => setAberto((valor) => !valor)}
        className="inline-flex size-11 items-center justify-center rounded-lg text-gelo hover:text-ciano"
      >
        {aberto ? <IconeFechar className="size-6" /> : <IconeMenu className="size-6" />}
        <span className="sr-only">{aberto ? "Fechar menu" : "Abrir menu"}</span>
      </button>

      <nav
        id="menu-movel"
        aria-label="Principal"
        hidden={!aberto}
        className="absolute inset-x-0 top-full border-b border-linha bg-azul-noite"
      >
        <ul className="container-site flex flex-col gap-1 py-4">
          {navegacao.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                onClick={fechar}
                className="flex min-h-11 items-center rounded-lg px-2 text-gelo hover:text-ciano"
              >
                {item.rotulo}
              </Link>
            </li>
          ))}
          <li className="pt-2">
            <Link href={chamadaPrincipal.href} onClick={fechar} className={classesBotao("primario", "w-full")}>
              {chamadaPrincipal.rotulo}
            </Link>
          </li>
        </ul>
      </nav>
    </div>
  );
}
