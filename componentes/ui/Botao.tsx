import Link from "next/link";
import type { ButtonHTMLAttributes, ComponentProps } from "react";

type Variante = "primario" | "secundario";

// min-h-11 = 44px: bem acima do mínimo de 24px do WCAG 2.5.8 e confortável no celular.
const base =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-base font-semibold " +
  "transition-colors disabled:cursor-not-allowed disabled:opacity-60";

const variantes: Record<Variante, string> = {
  // Texto azul-noite sobre ciano (7,7:1).
  primario: "bg-ciano text-azul-noite hover:bg-gelo",
  secundario: "border border-borda-campo text-gelo hover:border-ciano hover:text-ciano",
};

export function classesBotao(variante: Variante = "primario", extra = "") {
  return `${base} ${variantes[variante]} ${extra}`.trim();
}

type BotaoProps = ButtonHTMLAttributes<HTMLButtonElement> & { variante?: Variante };

export function Botao({ variante, className, type = "button", ...props }: BotaoProps) {
  return <button type={type} className={classesBotao(variante, className)} {...props} />;
}

type BotaoLinkProps = ComponentProps<typeof Link> & { variante?: Variante };

// Visual de botão, semântica de link: navega para outra página.
export function BotaoLink({ variante, className, ...props }: BotaoLinkProps) {
  return <Link className={classesBotao(variante, className)} {...props} />;
}
