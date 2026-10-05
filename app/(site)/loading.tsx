// Exibido enquanto um segmento carrega. As páginas públicas são estáticas, então isso
// quase nunca aparece; existe para a navegação nunca ficar sem resposta visual.
export default function Carregando() {
  return (
    <div role="status" className="container-site py-20">
      <span className="sr-only">Carregando…</span>
      <div aria-hidden className="space-y-4 motion-safe:animate-pulse">
        <div className="h-8 w-2/3 rounded bg-azul-profundo" />
        <div className="h-4 w-full rounded bg-azul-profundo" />
        <div className="h-4 w-5/6 rounded bg-azul-profundo" />
      </div>
    </div>
  );
}
