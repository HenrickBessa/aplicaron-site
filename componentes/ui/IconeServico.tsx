import type { Servico } from "@/lib/validacao/enums";

// Ícones dos serviços. Decorativos (aria-hidden): o título do cartão já diz o serviço.
// Ao passar o mouse no cartão (group-hover), cada ícone ganha um movimento próprio;
// as classes motion-safe: garantem que nada se mexe para quem pede menos movimento.
const comum = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
  className: "size-7",
};

function AutomacaoIa() {
  return (
    <svg {...comum}>
      {/* Engrenagem gira; "faíscas" da IA acendem. */}
      <g className="origin-center transition-transform duration-700 motion-safe:group-hover:rotate-90">
        <circle cx="12" cy="12" r="3" />
        <path d="M12 3v2.5M12 18.5V21M3 12h2.5M18.5 12H21M5.6 5.6l1.8 1.8M16.6 16.6l1.8 1.8M5.6 18.4l1.8-1.8M16.6 7.4l1.8-1.8" />
      </g>
      <path d="M19 2.5l.6 1.4 1.4.6-1.4.6-.6 1.4-.6-1.4-1.4-.6 1.4-.6z" className="opacity-60 transition-opacity group-hover:opacity-100" />
    </svg>
  );
}

function Sites() {
  return (
    <svg {...comum}>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M3 8.5h18" />
      <circle cx="6" cy="6.25" r=".5" fill="currentColor" />
      <circle cx="8" cy="6.25" r=".5" fill="currentColor" />
      {/* Linhas de "conteúdo" crescem; cursor pisca. */}
      <path d="M7 13h7M7 16h4" className="origin-left transition-transform duration-500 motion-safe:group-hover:scale-x-125" />
      <path d="M17 12.5v4" className="motion-safe:group-hover:animate-pulse" />
    </svg>
  );
}

function Sistemas() {
  return (
    <svg {...comum}>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      {/* Barras do painel sobem. */}
      <path d="M7.5 17v-3" className="origin-bottom transition-transform duration-500 motion-safe:group-hover:scale-y-150" />
      <path d="M12 17V9" className="origin-bottom transition-transform duration-500 delay-75 motion-safe:group-hover:scale-y-110" />
      <path d="M16.5 17v-6" className="origin-bottom transition-transform duration-500 delay-150 motion-safe:group-hover:scale-y-125" />
    </svg>
  );
}

function Aplicativos() {
  return (
    <svg {...comum}>
      {/* Celular "levanta" levemente. */}
      <g className="transition-transform duration-500 motion-safe:group-hover:-translate-y-0.5 motion-safe:group-hover:-rotate-6">
        <rect x="7" y="2.5" width="10" height="19" rx="2.2" />
        <path d="M10.5 18.5h3" />
        <path d="M9.5 7h5M9.5 10h3" className="opacity-60" />
      </g>
    </svg>
  );
}

const ICONES: Record<Exclude<Servico, "outro">, () => React.JSX.Element> = {
  automacao_ia: AutomacaoIa,
  sites: Sites,
  sistemas: Sistemas,
  aplicativos: Aplicativos,
};

export function IconeServico({ servico }: { servico: Exclude<Servico, "outro"> }) {
  const Icone = ICONES[servico];
  return (
    <span className="inline-flex size-14 items-center justify-center rounded-xl border border-ciano/30 bg-azul-noite text-ciano shadow-[0_0_24px_-6px_var(--color-ciano)] transition-shadow duration-300 group-hover:shadow-[0_0_32px_-4px_var(--color-ciano)]">
      <Icone />
    </span>
  );
}
