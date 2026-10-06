import type { ReactNode } from "react";

// Faz o conteúdo surgir (sobe e aparece) conforme entra na tela durante a rolagem.
// 100% CSS (animation-timeline: view(), ver .revelar em globals.css): nenhum JavaScript.
// Navegador sem suporte, ou visitante com "reduzir movimento": o conteúdo aparece normal.
export function Revelar({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`revelar ${className}`}>{children}</div>;
}
