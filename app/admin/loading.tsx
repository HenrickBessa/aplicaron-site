export default function CarregandoAdmin() {
  return (
    <div role="status">
      <span className="sr-only">Carregando…</span>
      <div aria-hidden className="space-y-4 motion-safe:animate-pulse">
        <div className="h-8 w-1/3 rounded bg-azul-profundo" />
        <div className="h-4 w-full rounded bg-azul-profundo" />
        <div className="h-4 w-5/6 rounded bg-azul-profundo" />
      </div>
    </div>
  );
}
