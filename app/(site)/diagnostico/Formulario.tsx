"use client";

import Link from "next/link";
import { unstable_isUnrecognizedActionError } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore, useTransition, type FormEvent } from "react";
import { Botao } from "@/componentes/ui/Botao";
import { CaixaSelecao, CampoAreaTexto, CampoTexto, GrupoOpcoes } from "@/componentes/ui/campos";
import { linkWhatsapp } from "@/conteudo/site";
import {
  errosPorCampo,
  etapaContatoSchema,
  etapaProjetoSchema,
  etapaServicoSchema,
  type CampoDiagnostico,
  type ErrosCampos,
} from "@/lib/validacao/diagnostico";
import { FAIXAS_ORCAMENTO, ROTULOS_FAIXA, servicoSchema } from "@/lib/validacao/enums";
import { enviarDiagnostico } from "./acoes";
import { lerRascunho, salvarRascunho, type Rascunho, type Rastreio, type ValoresFormulario } from "./rascunho";

type Etapa = 1 | 2 | 3;

const ETAPAS: Record<Etapa, { titulo: string; campos: CampoDiagnostico[] }> = {
  1: { titulo: "Qual serviço você procura?", campos: ["servico"] },
  2: { titulo: "Conte sobre o projeto", campos: ["faixa_orcamento", "descricao"] },
  3: { titulo: "Como falamos com você?", campos: ["nome", "email", "whatsapp", "empresa", "marketing_optin"] },
};

const ESQUEMAS = { 1: etapaServicoSchema, 2: etapaProjetoSchema, 3: etapaContatoSchema } as const;

const OPCOES_SERVICO = [
  { valor: "automacao_ia", rotulo: "Automação com IA", descricao: "Atendimento, triagem, integrações" },
  { valor: "sites", rotulo: "Site", descricao: "Institucional ou landing page" },
  { valor: "sistemas", rotulo: "Sistema", descricao: "Painel, controle interno, portal" },
  { valor: "aplicativos", rotulo: "Aplicativo", descricao: "Android e iOS" },
  { valor: "outro", rotulo: "Outro / não sei", descricao: "Vamos entender juntos" },
];

const OPCOES_FAIXA = FAIXAS_ORCAMENTO.map((valor) => ({ valor, rotulo: ROTULOS_FAIXA[valor] }));

const ROTULOS_CAMPO: Record<CampoDiagnostico, string> = {
  servico: "Serviço",
  faixa_orcamento: "Faixa de orçamento",
  descricao: "Descrição do projeto",
  nome: "Nome",
  email: "E-mail",
  whatsapp: "WhatsApp",
  empresa: "Empresa",
  marketing_optin: "Novidades por e-mail",
};

// id do elemento que recebe o foco quando o visitante clica no erro do resumo.
function idDoCampo(campo: CampoDiagnostico) {
  if (campo === "servico") return `diag-servico-${OPCOES_SERVICO[0].valor}`;
  if (campo === "faixa_orcamento") return `diag-faixa-${OPCOES_FAIXA[0].valor}`;
  return `diag-${campo}`;
}

function etapaDoCampo(campo: CampoDiagnostico): Etapa {
  return ([1, 2, 3] as const).find((e) => ETAPAS[e].campos.includes(campo)) ?? 3;
}

const VALORES_INICIAIS: ValoresFormulario = {
  servico: "",
  faixa_orcamento: "",
  descricao: "",
  nome: "",
  email: "",
  whatsapp: "",
  empresa: "",
  marketing_optin: false,
};

type ErroGeral = "indisponivel" | "versao" | null;

// Lê origem e UTMs na primeira visita ao formulário. Não grava IP, navegador nem localização.
function lerRastreio(): Rastreio {
  const params = new URLSearchParams(window.location.search);
  let paginaOrigem: string | undefined;
  try {
    const anterior = document.referrer ? new URL(document.referrer) : null;
    // Só a página interna de onde a pessoa veio (ex.: /servicos/sites); referências externas são ignoradas.
    if (anterior && anterior.origin === window.location.origin) paginaOrigem = anterior.pathname;
  } catch {
    // referrer inválido: ignora
  }
  return {
    pagina_origem: paginaOrigem,
    utm_source: params.get("utm_source") ?? undefined,
    utm_medium: params.get("utm_medium") ?? undefined,
    utm_campaign: params.get("utm_campaign") ?? undefined,
  };
}

// Estado inicial lido UMA vez, no primeiro render do formulário no navegador:
// restaura o rascunho desta aba ou começa um novo (aplicando ?servico= se válido).
function lerEstadoInicial(): Rascunho & { abertura: number } {
  const abertura = Date.now();
  const salvo = lerRascunho();
  if (salvo) return { ...salvo, valores: { ...VALORES_INICIAIS, ...salvo.valores }, abertura };

  // Inválido (ex.: ?servico=xyz) é simplesmente ignorado.
  const servicoUrl = servicoSchema.safeParse(new URLSearchParams(window.location.search).get("servico"));
  return {
    submission_id: crypto.randomUUID(),
    etapa: 1,
    valores: { ...VALORES_INICIAIS, servico: servicoUrl.success ? servicoUrl.data : "" },
    rastreio: lerRastreio(),
    abertura,
  };
}

const semAssinatura = () => () => {};

// sessionStorage e a URL só existem no navegador. No servidor (e até a hidratação)
// mostramos um esqueleto; depois o formulário monta já com o estado certo, sem "piscar".
// O envio depende de JavaScript de qualquer forma; o <noscript> oferece o WhatsApp.
export function Formulario() {
  const noNavegador = useSyncExternalStore(semAssinatura, () => true, () => false);
  if (!noNavegador) {
    return (
      <div className="space-y-4 rounded-xl bg-azul-profundo p-5 sm:p-8">
        <noscript>
          <p className="text-gelo">
            O formulário precisa de JavaScript. Se preferir, fale com a gente pelo{" "}
            <a href={linkWhatsapp} className="text-ciano underline">
              WhatsApp
            </a>
            .
          </p>
        </noscript>
        <div aria-hidden className="h-8 w-2/3 rounded bg-azul-noite motion-safe:animate-pulse" />
        <div aria-hidden className="h-40 rounded bg-azul-noite motion-safe:animate-pulse" />
      </div>
    );
  }
  return <FormularioEtapas />;
}

function FormularioEtapas() {
  const [inicial] = useState(lerEstadoInicial);
  const [etapa, setEtapa] = useState<Etapa>(inicial.etapa);
  const [valores, setValores] = useState<ValoresFormulario>(inicial.valores);
  const [erros, setErros] = useState<ErrosCampos>({});
  const [erroGeral, setErroGeral] = useState<ErroGeral>(null);
  const [enviando, iniciarEnvio] = useTransition();
  const [focarResumo, setFocarResumo] = useState(0);

  const honeypot = useRef<HTMLInputElement>(null);
  const tituloRef = useRef<HTMLHeadingElement>(null);
  const resumoRef = useRef<HTMLDivElement>(null);
  const trocouEtapa = useRef(false);

  // Mantém o rascunho da aba em dia a cada mudança.
  useEffect(() => {
    salvarRascunho({ submission_id: inicial.submission_id, etapa, valores, rastreio: inicial.rastreio });
  }, [inicial, etapa, valores]);

  // Ao trocar de etapa, o foco vai para o título ("Etapa 2 de 3: ..."), para o leitor de tela anunciar.
  useEffect(() => {
    if (trocouEtapa.current) tituloRef.current?.focus();
  }, [etapa]);

  useEffect(() => {
    if (focarResumo) resumoRef.current?.focus();
  }, [focarResumo]);

  function alterar<K extends keyof ValoresFormulario>(campo: K, valor: ValoresFormulario[K]) {
    setValores((v) => ({ ...v, [campo]: valor }));
  }

  function irPara(nova: Etapa) {
    trocouEtapa.current = true;
    setEtapa(nova);
  }

  function mostrarErros(novos: ErrosCampos) {
    setErros(novos);
    setFocarResumo((n) => n + 1);
  }

  function validarEtapa(e: Etapa): boolean {
    const resultado = ESQUEMAS[e].safeParse(valores);
    if (resultado.success) {
      setErros({});
      return true;
    }
    mostrarErros(errosPorCampo(resultado.error));
    return false;
  }

  function aoEnviar(evento: FormEvent) {
    evento.preventDefault();
    setErroGeral(null);
    if (!validarEtapa(etapa)) return;
    if (etapa < 3) {
      irPara((etapa + 1) as Etapa);
      return;
    }

    iniciarEnvio(async () => {
      try {
        // Em caso de sucesso a Action redireciona para /obrigado e esta promessa não traz erros.
        const resultado = await enviarDiagnostico({
          ...valores,
          ...inicial.rastreio,
          submission_id: inicial.submission_id,
          tempo_preenchimento_ms: Date.now() - inicial.abertura,
          site: honeypot.current?.value ?? "",
        });
        if (!resultado) return;
        if ("erros" in resultado) {
          const primeiro = Object.keys(resultado.erros)[0] as CampoDiagnostico | undefined;
          if (primeiro) irPara(etapaDoCampo(primeiro));
          mostrarErros(resultado.erros);
        } else {
          setErroGeral(resultado.erroGeral);
          setFocarResumo((n) => n + 1);
        }
      } catch (erro) {
        // Deploy novo enquanto a pessoa preenchia: a Action antiga não existe mais no servidor.
        setErroGeral(unstable_isUnrecognizedActionError(erro) ? "versao" : "indisponivel");
        setFocarResumo((n) => n + 1);
      }
    });
  }

  const listaErros = (Object.entries(erros) as [CampoDiagnostico, string][]).filter(([, m]) => m);
  const temAviso = listaErros.length > 0 || erroGeral !== null;

  return (
    <form noValidate onSubmit={aoEnviar} className="space-y-8 rounded-xl bg-azul-profundo p-5 sm:p-8" aria-busy={enviando}>
      {/* Progresso visual; o texto "Etapa X de 3" no título é o que conta para acessibilidade. */}
      <div aria-hidden className="flex gap-2">
        {[1, 2, 3].map((n) => (
          <div key={n} className={`h-1.5 flex-1 rounded-full ${n <= etapa ? "bg-ciano" : "bg-linha"}`} />
        ))}
      </div>

      <h2 ref={tituloRef} tabIndex={-1} className="text-2xl font-bold focus:outline-none sm:text-3xl">
        <span className="block text-sm font-semibold tracking-wide text-ciano uppercase">Etapa {etapa} de 3</span>
        {ETAPAS[etapa].titulo}
      </h2>

      {temAviso && (
        <div
          ref={resumoRef}
          tabIndex={-1}
          aria-labelledby="resumo-erros-titulo"
          className="space-y-3 rounded-lg border-2 border-erro bg-azul-noite p-4 focus:outline-none"
        >
          {erroGeral === "versao" ? (
            <>
              <p id="resumo-erros-titulo" className="font-semibold text-gelo">
                O site foi atualizado enquanto você preenchia.
              </p>
              <p className="text-cinza-azulado">
                Recarregue a página e envie de novo. O que você digitou continua salvo nesta aba.
              </p>
              <Botao variante="secundario" onClick={() => window.location.reload()}>
                Recarregar página
              </Botao>
            </>
          ) : erroGeral === "indisponivel" ? (
            <>
              <p id="resumo-erros-titulo" className="font-semibold text-gelo">
                Não conseguimos enviar agora.
              </p>
              <p className="text-cinza-azulado">
                Seus dados continuam aqui. Tente de novo em instantes ou fale com a gente pelo{" "}
                <a href={linkWhatsapp} target="_blank" rel="noopener noreferrer" className="text-ciano underline">
                  WhatsApp<span className="sr-only"> (abre em nova aba)</span>
                </a>
                .
              </p>
            </>
          ) : (
            <>
              <p id="resumo-erros-titulo" className="font-semibold text-gelo">
                {listaErros.length === 1 ? "Corrija 1 campo para continuar:" : `Corrija ${listaErros.length} campos para continuar:`}
              </p>
              <ul className="list-disc space-y-1 pl-5">
                {listaErros.map(([campo, mensagem]) => (
                  <li key={campo}>
                    <a
                      href={`#${idDoCampo(campo)}`}
                      onClick={(e) => {
                        e.preventDefault();
                        document.getElementById(idDoCampo(campo))?.focus();
                      }}
                      className="text-erro underline underline-offset-2"
                    >
                      {ROTULOS_CAMPO[campo]}: {mensagem}
                    </a>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}

      {etapa === 1 && (
        <GrupoOpcoes
          id="diag-servico"
          name="servico"
          legenda="Tipo de serviço"
          opcoes={OPCOES_SERVICO}
          valor={valores.servico}
          aoMudar={(v) => alterar("servico", v)}
          erro={erros.servico}
        />
      )}

      {etapa === 2 && (
        <div className="space-y-6">
          <GrupoOpcoes
            id="diag-faixa"
            name="faixa_orcamento"
            legenda="Quanto pretende investir?"
            opcoes={OPCOES_FAIXA}
            valor={valores.faixa_orcamento}
            aoMudar={(v) => alterar("faixa_orcamento", v)}
            erro={erros.faixa_orcamento}
          />
          <div>
            <CampoAreaTexto
              id="diag-descricao"
              name="descricao"
              rotulo="Conte sobre o projeto"
              dica="O que você precisa resolver, para quem e até quando. Entre 10 e 2.000 caracteres."
              maxLength={2000}
              value={valores.descricao}
              onChange={(e) => alterar("descricao", e.target.value)}
              erro={erros.descricao}
            />
            <p aria-hidden className="mt-1 text-right text-xs text-cinza-azulado">
              {valores.descricao.length}/2000
            </p>
          </div>
        </div>
      )}

      {etapa === 3 && (
        <div className="space-y-6">
          <CampoTexto
            id="diag-nome"
            name="nome"
            rotulo="Nome"
            autoComplete="name"
            maxLength={120}
            value={valores.nome}
            onChange={(e) => alterar("nome", e.target.value)}
            erro={erros.nome}
          />
          <CampoTexto
            id="diag-email"
            name="email"
            type="email"
            rotulo="E-mail"
            autoComplete="email"
            maxLength={254}
            value={valores.email}
            onChange={(e) => alterar("email", e.target.value)}
            erro={erros.email}
          />
          <CampoTexto
            id="diag-whatsapp"
            name="whatsapp"
            type="tel"
            inputMode="tel"
            rotulo="WhatsApp"
            dica="Com DDD. Ex.: (47) 98880-0836"
            autoComplete="tel"
            opcional
            value={valores.whatsapp}
            onChange={(e) => alterar("whatsapp", e.target.value)}
            erro={erros.whatsapp}
          />
          <CampoTexto
            id="diag-empresa"
            name="empresa"
            rotulo="Empresa"
            autoComplete="organization"
            maxLength={120}
            opcional
            value={valores.empresa}
            onChange={(e) => alterar("empresa", e.target.value)}
            erro={erros.empresa}
          />
          <CaixaSelecao
            id="diag-marketing_optin"
            name="marketing_optin"
            rotulo="Quero receber novidades da AplicarOn por e-mail."
            dica="Opcional. Você pode cancelar quando quiser."
            checked={valores.marketing_optin}
            onChange={(e) => alterar("marketing_optin", e.target.checked)}
          />
          {/* Aviso LGPD: sem checkbox obrigatório. A versão da política é gravada pelo servidor. */}
          <p className="text-sm text-cinza-azulado">
            Usaremos seus dados para responder a este pedido. Saiba mais na{" "}
            <Link href="/privacidade" target="_blank" className="text-ciano underline underline-offset-2">
              política de privacidade<span className="sr-only"> (abre em nova aba)</span>
            </Link>
            .
          </p>
        </div>
      )}

      {/* Honeypot: invisível para pessoas e fora da ordem do Tab. Robôs costumam preenchê-lo. */}
      <div aria-hidden className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label htmlFor="diag-site">Não preencha este campo</label>
        <input ref={honeypot} id="diag-site" name="site" type="text" tabIndex={-1} autoComplete="off" defaultValue="" />
      </div>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
        {etapa > 1 ? (
          <Botao variante="secundario" onClick={() => { setErros({}); irPara((etapa - 1) as Etapa); }} disabled={enviando}>
            Voltar
          </Botao>
        ) : (
          <span />
        )}
        <Botao type="submit" disabled={enviando}>
          {etapa < 3 ? "Continuar" : enviando ? "Enviando…" : "Enviar diagnóstico"}
        </Botao>
      </div>

      {/* Anuncia o envio para leitores de tela sem mover o foco. */}
      <p role="status" className="sr-only">
        {enviando ? "Enviando seu diagnóstico…" : ""}
      </p>
    </form>
  );
}
