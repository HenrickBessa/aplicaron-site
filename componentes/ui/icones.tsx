import type { SVGProps } from "react";

// Ícones decorativos: aria-hidden, porque o texto ao lado já diz o que importa.
type IconeProps = SVGProps<SVGSVGElement>;

const comum = {
  width: 20,
  height: 20,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
  focusable: false,
} as const;

export function IconeMenu(props: IconeProps) {
  return (
    <svg {...comum} {...props}>
      <path d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

export function IconeFechar(props: IconeProps) {
  return (
    <svg {...comum} {...props}>
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

export function IconeErro(props: IconeProps) {
  return (
    <svg {...comum} {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.5v5M12 16h.01" />
    </svg>
  );
}
