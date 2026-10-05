import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from "react";
import { IconeErro } from "./icones";

// Regras de acessibilidade aplicadas em todos os campos (WCAG 2.2 AA):
// - label visível ligado ao campo por htmlFor/id;
// - dica e erro ligados por aria-describedby (o leitor de tela lê junto com o label);
// - aria-invalid quando há erro;
// - erro com ícone + texto, nunca só cor;
// - campos opcionais marcados como "(opcional)", em vez de asterisco nos obrigatórios.
// O `id` é obrigatório porque o resumo de erros (fatia 4) cria links para cada campo.

const estiloCampo =
  "block w-full rounded-lg border border-borda-campo bg-azul-noite px-3 py-2.5 text-base text-gelo " +
  "placeholder:text-cinza-azulado aria-invalid:border-erro";

type CampoBase = {
  id: string;
  rotulo: string;
  dica?: string;
  erro?: string;
  opcional?: boolean;
};

function idsDescricao(id: string, dica?: string, erro?: string) {
  const ids = [dica && `${id}-dica`, erro && `${id}-erro`].filter(Boolean).join(" ");
  return ids || undefined;
}

function Rotulo({ htmlFor, children, opcional }: { htmlFor: string; children: ReactNode; opcional?: boolean }) {
  return (
    <label htmlFor={htmlFor} className="block font-medium text-gelo">
      {children}
      {opcional && <span className="font-normal text-cinza-azulado"> (opcional)</span>}
    </label>
  );
}

function Dica({ id, children }: { id: string; children: ReactNode }) {
  return (
    <p id={id} className="text-sm text-cinza-azulado">
      {children}
    </p>
  );
}

export function MensagemErro({ id, children }: { id: string; children: ReactNode }) {
  return (
    <p id={id} className="flex items-start gap-1.5 text-sm font-medium text-erro">
      <IconeErro className="mt-px size-4 shrink-0" />
      <span>{children}</span>
    </p>
  );
}

// ---------------------------------------------------------------------------

type CampoTextoProps = CampoBase & Omit<InputHTMLAttributes<HTMLInputElement>, "id">;

export function CampoTexto({ id, rotulo, dica, erro, opcional, className, ...props }: CampoTextoProps) {
  return (
    <div className="space-y-1.5">
      <Rotulo htmlFor={id} opcional={opcional}>
        {rotulo}
      </Rotulo>
      {dica && <Dica id={`${id}-dica`}>{dica}</Dica>}
      <input
        id={id}
        required={!opcional}
        aria-invalid={erro ? true : undefined}
        aria-describedby={idsDescricao(id, dica, erro)}
        className={`${estiloCampo} min-h-11 ${className ?? ""}`}
        {...props}
      />
      {erro && <MensagemErro id={`${id}-erro`}>{erro}</MensagemErro>}
    </div>
  );
}

type CampoAreaTextoProps = CampoBase & Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "id">;

export function CampoAreaTexto({ id, rotulo, dica, erro, opcional, className, ...props }: CampoAreaTextoProps) {
  return (
    <div className="space-y-1.5">
      <Rotulo htmlFor={id} opcional={opcional}>
        {rotulo}
      </Rotulo>
      {dica && <Dica id={`${id}-dica`}>{dica}</Dica>}
      <textarea
        id={id}
        rows={5}
        required={!opcional}
        aria-invalid={erro ? true : undefined}
        aria-describedby={idsDescricao(id, dica, erro)}
        className={`${estiloCampo} resize-y ${className ?? ""}`}
        {...props}
      />
      {erro && <MensagemErro id={`${id}-erro`}>{erro}</MensagemErro>}
    </div>
  );
}

// ---------------------------------------------------------------------------

type CaixaSelecaoProps = Omit<CampoBase, "opcional"> & Omit<InputHTMLAttributes<HTMLInputElement>, "id" | "type">;

export function CaixaSelecao({ id, rotulo, dica, erro, ...props }: CaixaSelecaoProps) {
  return (
    <div className="space-y-1.5">
      {/* O label envolve só o texto; o alvo clicável (label + caixa) passa de 24px de altura. */}
      <div className="flex items-start gap-3">
        <input
          id={id}
          type="checkbox"
          aria-invalid={erro ? true : undefined}
          aria-describedby={idsDescricao(id, dica, erro)}
          className="mt-0.5 size-5 shrink-0 accent-ciano"
          {...props}
        />
        <div className="space-y-1">
          <label htmlFor={id} className="block text-gelo">
            {rotulo}
          </label>
          {dica && <Dica id={`${id}-dica`}>{dica}</Dica>}
        </div>
      </div>
      {erro && <MensagemErro id={`${id}-erro`}>{erro}</MensagemErro>}
    </div>
  );
}

// ---------------------------------------------------------------------------

export type Opcao = { valor: string; rotulo: string; descricao?: string };

type GrupoOpcoesProps = {
  id: string;
  name: string;
  legenda: string;
  opcoes: readonly Opcao[];
  valorPadrao?: string;
  erro?: string;
  dica?: string;
};

// Grupo de rádios em cartões. fieldset + legend: o leitor de tela anuncia a pergunta
// ("Qual serviço você procura?") antes de cada opção.
export function GrupoOpcoes({ id, name, legenda, opcoes, valorPadrao, erro, dica }: GrupoOpcoesProps) {
  return (
    <fieldset id={id} aria-describedby={idsDescricao(id, dica, erro)} className="space-y-3">
      <legend className="font-medium text-gelo">{legenda}</legend>
      {dica && <Dica id={`${id}-dica`}>{dica}</Dica>}
      <div className="grid gap-3 sm:grid-cols-2">
        {opcoes.map((opcao) => {
          const idOpcao = `${id}-${opcao.valor}`;
          return (
            <label
              key={opcao.valor}
              htmlFor={idOpcao}
              className={
                "flex cursor-pointer items-start gap-3 rounded-lg border border-borda-campo bg-azul-profundo p-4 " +
                "transition-colors hover:border-ciano has-checked:border-ciano has-checked:bg-azul-noite " +
                "has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-ciano"
              }
            >
              <input
                id={idOpcao}
                type="radio"
                name={name}
                value={opcao.valor}
                defaultChecked={valorPadrao === opcao.valor}
                // Sem aria-invalid: não é suportado em radio. O erro chega pelo aria-describedby do fieldset.
                // O foco é desenhado no cartão inteiro (has-focus-visible acima).
                className="mt-1 size-4 shrink-0 accent-ciano focus-visible:outline-none"
              />
              <span className="space-y-1">
                <span className="block font-medium text-gelo">{opcao.rotulo}</span>
                {opcao.descricao && <span className="block text-sm text-cinza-azulado">{opcao.descricao}</span>}
              </span>
            </label>
          );
        })}
      </div>
      {erro && <MensagemErro id={`${id}-erro`}>{erro}</MensagemErro>}
    </fieldset>
  );
}
