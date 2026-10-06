import type { CSSProperties } from "react";
import { tecnologias, type Tecnologia } from "@/conteudo/tecnologias";

// Luminância relativa (WCAG) de uma cor hex, para decidir se a cor da marca é legível no fundo escuro.
function luminancia(hex: string) {
  const [r, g, b] = [0, 2, 4].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
const LUMINANCIA_FUNDO = luminancia("0b1a2e");
// Contraste mínimo de 3:1 (componente gráfico). Marcas pretas (Next.js, Vercel...) ficam na cor do texto.
const corHover = (hex: string) => ((luminancia(hex) + 0.05) / (LUMINANCIA_FUNDO + 0.05) >= 3 ? `#${hex}` : "var(--color-ciano)");

function Item({ tecnologia }: { tecnologia: Tecnologia }) {
  return (
    <li
      className="group flex shrink-0 flex-col items-center gap-2 px-6"
      style={{ "--cor-marca": corHover(tecnologia.icone.hex) } as CSSProperties}
    >
      <svg
        aria-hidden
        viewBox="0 0 24 24"
        className="size-10 fill-cinza-azulado transition-colors duration-300 group-hover:fill-[var(--cor-marca)]"
      >
        <path d={tecnologia.icone.path} />
      </svg>
      <span className="text-sm whitespace-nowrap text-cinza-azulado">{tecnologia.nome}</span>
    </li>
  );
}

// Faixa que rola na horizontal sem parar. A lista é renderizada duas vezes e a faixa anda 50%:
// o fim encaixa no começo (loop sem emenda). A cópia é aria-hidden: o leitor de tela lê uma vez só.
// Pausa no hover/foco; com "reduzir movimento", fica parada e quebra em linhas (todas visíveis).
export function CarrosselTecnologias() {
  return (
    <div className="overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)] motion-reduce:[mask-image:none]">
      <div className="faixa-rolante flex w-max motion-reduce:w-auto">
        <ul className="flex motion-reduce:flex-wrap motion-reduce:justify-center motion-reduce:gap-y-6" aria-label="Tecnologias que utilizamos">
          {tecnologias.map((t) => (
            <Item key={t.nome} tecnologia={t} />
          ))}
        </ul>
        <ul className="flex motion-reduce:hidden" aria-hidden>
          {tecnologias.map((t) => (
            <Item key={t.nome} tecnologia={t} />
          ))}
        </ul>
      </div>
    </div>
  );
}
