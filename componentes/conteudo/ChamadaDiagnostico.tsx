import { BotaoLink } from "@/componentes/ui/Botao";
import type { Servico } from "@/lib/validacao/enums";

// Faixa de chamada para o diagnóstico, no fim das páginas.
// Com `servico`, o link pré-seleciona a etapa 1 do formulário (?servico=...).
export function ChamadaDiagnostico({ servico }: { servico?: Servico }) {
  const href = servico ? `/diagnostico?servico=${servico}` : "/diagnostico";
  return (
    <section aria-labelledby="chamada-diagnostico" className="border-t border-linha bg-azul-profundo">
      <div className="container-site flex flex-col items-start gap-6 py-14 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <h2 id="chamada-diagnostico" className="text-2xl font-bold">
            Vamos tirar seu projeto do papel?
          </h2>
          <p className="text-cinza-azulado">Diagnóstico gratuito em 3 etapas rápidas, sem compromisso.</p>
        </div>
        <BotaoLink href={href}>Fazer diagnóstico gratuito</BotaoLink>
      </div>
    </section>
  );
}
