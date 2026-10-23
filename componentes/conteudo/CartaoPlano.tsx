import { BotaoLink, classesBotao } from "@/componentes/ui/Botao";
import { emReais, SELO_LANCAMENTO, textoPrazo, type DadosPlano } from "@/conteudo/planos";

type Props = {
  plano: DadosPlano;
  // Para onde vai o "Quero este plano". Na própria /planos, a âncora do formulário.
  hrefAcao?: string;
  // Na home: sem as listas de inclui / não inclui.
  resumido?: boolean;
};

export function CartaoPlano({ plano, hrefAcao = `#quero-${plano.slug}`, resumido = false }: Props) {
  const idTitulo = `plano-${plano.slug}-titulo`;
  const rotuloAcao = `Quero este plano: ${plano.nome}`;
  const variante = plano.destaque ? "primario" : "secundario";
  return (
    <article
      aria-labelledby={idTitulo}
      className={`flex h-full flex-col gap-5 rounded-xl border bg-azul-profundo p-6 sm:p-8 ${
        plano.destaque ? "border-ciano" : "border-linha"
      }`}
    >
      <div className="space-y-2">
        {plano.destaque && (
          <p className="inline-flex rounded-full bg-ciano px-3 py-1 text-xs font-semibold tracking-wide text-azul-noite uppercase">
            Mais escolhido
          </p>
        )}
        <h3 id={idTitulo} className="text-2xl font-bold text-gelo">
          {plano.nome}
        </h3>
        <p className="text-cinza-azulado">{plano.resumo}</p>
      </div>

      <dl className="space-y-3">
        <div>
          <dt className="text-sm text-cinza-azulado">Mensalidade</dt>
          <dd className="text-gelo">
            <span className="font-titulo text-3xl font-bold">{emReais(plano.mensalidade)}</span>/mês
            {plano.mensalidadeDetalhe && <span className="block text-sm text-cinza-azulado">{plano.mensalidadeDetalhe}</span>}
          </dd>
        </div>
        <div>
          <dt className="text-sm text-cinza-azulado">Implantação</dt>
          <dd className="text-gelo">a partir de {emReais(plano.implantacao)}</dd>
        </div>
        <div>
          <dt className="text-sm text-cinza-azulado">Prazo estimado</dt>
          <dd className="font-medium text-gelo">{textoPrazo(plano.prazoDiasUteis)}</dd>
        </div>
      </dl>

      <p className="text-sm font-medium text-ciano">{SELO_LANCAMENTO}</p>

      {!resumido && (
        <>
          <div>
            <h4 className="font-semibold text-gelo">Inclui</h4>
            <ul className="mt-2 space-y-2 text-sm text-gelo">
              {plano.inclui.map((item) => (
                <li key={item} className="flex gap-2">
                  <span aria-hidden className="text-ciano">
                    ✓
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-gelo">Não inclui</h4>
            <ul className="mt-2 space-y-2 text-sm text-cinza-azulado">
              {plano.naoInclui.map((item) => (
                <li key={item} className="flex gap-2">
                  <span aria-hidden>–</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </>
      )}

      {/* aria-label começa pelo texto visível (WCAG 2.5.3) e diz qual plano, já que há três botões iguais. */}
      {hrefAcao.startsWith("#") ? (
        // Âncora na mesma página: <a> comum, porque o Link do Next troca o # sem disparar "hashchange",
        // que é o que marca o plano no formulário.
        <a href={hrefAcao} aria-label={rotuloAcao} className={classesBotao(variante, "mt-auto")}>
          Quero este plano
        </a>
      ) : (
        <BotaoLink href={hrefAcao} aria-label={rotuloAcao} variante={variante} className="mt-auto">
          Quero este plano
        </BotaoLink>
      )}
    </article>
  );
}
