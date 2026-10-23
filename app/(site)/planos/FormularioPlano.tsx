"use client";

import Link from "next/link";
import { unstable_isUnrecognizedActionError } from "next/navigation";
import { useEffect, useRef, useState, useTransition, type FormEvent } from "react";
import { Botao } from "@/componentes/ui/Botao";
import { CaixaSelecao, CampoAreaTexto, CampoTexto, GrupoOpcoes } from "@/componentes/ui/campos";
import { addons, buscarPlano, planos } from "@/conteudo/planos";
import { linkWhatsapp, linkWhatsappCom } from "@/conteudo/site";
import { errosPorCampo } from "@/lib/validacao/diagnostico";
import { planoSchema, type Addon } from "@/lib/validacao/enums";
import { planoFormSchema, type CampoPlano, type ErrosPlano } from "@/lib/validacao/plano";
import { enviarInteressePlano } from "./acoes";

const OPCOES_PLANO = planos.map((p) => ({ valor: p.slug, rotulo: p.nome, descricao: p.resumo }));

const ROTULOS_CAMPO: Record<CampoPlano, string> = {
  plano: "Plano",
  addons: "Add-ons",
  descricao: "O que você precisa",
  nome: "Nome",
  email: "E-mail",
  whatsapp: "WhatsApp",
  empresa: "Empresa ou negócio",
  cidade: "Cidade",
  segmento: "Segmento",
  marketing_optin: "Novidades por e-mail",
};

const idDoCampo = (campo: CampoPlano) =>
  campo === "plano" ? `plano-plano-${OPCOES_PLANO[0].valor}` : campo === "addons" ? `plano-addon-${addons[0].slug}` : `plano-${campo}`;

type Valores = {
  plano: string;
  addons: Addon[];
  descricao: string;
  nome: string;
  email: string;
  whatsapp: string;
  empresa: string;
  cidade: string;
  segmento: string;
  marketing_optin: boolean;
};

// Os cartões da página levam para #quero-<plano>; aqui o plano é marcado e o foco vem para o formulário.
const PREFIXO_ANCORA = "#quero-";

export function FormularioPlano({ planoInicial = "" }: { planoInicial?: string }) {
  const [valores, setValores] = useState<Valores>({
    plano: planoInicial,
    addons: [],
    descricao: "",
    nome: "",
    email: "",
    whatsapp: "",
    empresa: "",
    cidade: "",
    segmento: "",
    marketing_optin: false,
  });
  const [erros, setErros] = useState<ErrosPlano>({});
  const [erroGeral, setErroGeral] = useState<"indisponivel" | "versao" | null>(null);
  const [enviando, iniciarEnvio] = useTransition();
  const [focarResumo, setFocarResumo] = useState(0);

  const abertura = useRef(0);
  const submissionId = useRef<string | null>(null);
  const honeypot = useRef<HTMLInputElement>(null);
  const tituloRef = useRef<HTMLHeadingElement>(null);
  const resumoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    abertura.current = Date.now();
    function lerAncora() {
      if (!window.location.hash.startsWith(PREFIXO_ANCORA)) return;
      const plano = planoSchema.safeParse(window.location.hash.slice(PREFIXO_ANCORA.length));
      if (!plano.success) return;
      setValores((v) => ({ ...v, plano: plano.data }));
      tituloRef.current?.focus();
    }
    lerAncora();
    window.addEventListener("hashchange", lerAncora);
    return () => window.removeEventListener("hashchange", lerAncora);
  }, []);

  useEffect(() => {
    if (focarResumo) resumoRef.current?.focus();
  }, [focarResumo]);

  function alterar<K extends keyof Valores>(campo: K, valor: Valores[K]) {
    setValores((v) => ({ ...v, [campo]: valor }));
  }

  function alternarAddon(addon: Addon, marcado: boolean) {
    setValores((v) => ({ ...v, addons: marcado ? [...v.addons, addon] : v.addons.filter((a) => a !== addon) }));
  }

  function mostrarErros(novos: ErrosPlano) {
    setErros(novos);
    setFocarResumo((n) => n + 1);
  }

  function aoEnviar(evento: FormEvent) {
    evento.preventDefault();
    setErroGeral(null);
    const validacao = planoFormSchema.safeParse(valores);
    if (!validacao.success) {
      mostrarErros(errosPorCampo<CampoPlano>(validacao.error));
      return;
    }
    setErros({});
    // Mesmo id em todas as tentativas desta tela: reenviar não duplica o lead.
    submissionId.current ??= crypto.randomUUID();
    const params = new URLSearchParams(window.location.search);

    iniciarEnvio(async () => {
      try {
        const resultado = await enviarInteressePlano({
          ...valores,
          submission_id: submissionId.current,
          pagina_origem: window.location.pathname,
          utm_source: params.get("utm_source") ?? undefined,
          utm_medium: params.get("utm_medium") ?? undefined,
          utm_campaign: params.get("utm_campaign") ?? undefined,
          tempo_preenchimento_ms: Date.now() - abertura.current,
          site: honeypot.current?.value ?? "",
        });
        if (resultado.ok) {
          window.location.assign(resultado.whatsapp);
        } else if ("erros" in resultado) {
          mostrarErros(resultado.erros);
        } else {
          setErroGeral(resultado.erroGeral);
          setFocarResumo((n) => n + 1);
        }
      } catch (erro) {
        setErroGeral(unstable_isUnrecognizedActionError(erro) ? "versao" : "indisponivel");
        setFocarResumo((n) => n + 1);
      }
    });
  }

  const listaErros = (Object.entries(erros) as [CampoPlano, string][]).filter(([, m]) => m);
  const temAviso = listaErros.length > 0 || erroGeral !== null;
  // Plano já escolhido: se o envio falhar, o link direto leva a mensagem dele.
  const linkReserva = buscarPlano(valores.plano) ? linkWhatsappCom(buscarPlano(valores.plano)!.mensagemWhatsApp) : linkWhatsapp;

  return (
    <form noValidate onSubmit={aoEnviar} className="space-y-8 rounded-xl bg-azul-profundo p-5 sm:p-8" aria-busy={enviando}>
      <h2 ref={tituloRef} tabIndex={-1} className="text-2xl font-bold focus:outline-none sm:text-3xl">
        Quero este plano
      </h2>
      <p className="text-cinza-azulado">
        Preencha em um minuto. Ao enviar, abrimos o WhatsApp com a mensagem pronta para você só apertar enviar.
      </p>
      <noscript>
        <p className="text-gelo">
          O formulário precisa de JavaScript. Se preferir, fale com a gente direto pelo{" "}
          <a href={linkWhatsapp} className="text-ciano underline">
            WhatsApp
          </a>
          .
        </p>
      </noscript>

      {temAviso && (
        <div
          ref={resumoRef}
          tabIndex={-1}
          aria-labelledby="plano-resumo-erros-titulo"
          className="space-y-3 rounded-lg border-2 border-erro bg-azul-noite p-4 focus:outline-none"
        >
          {erroGeral === "versao" ? (
            <>
              <p id="plano-resumo-erros-titulo" className="font-semibold text-gelo">
                O site foi atualizado enquanto você preenchia.
              </p>
              <Botao variante="secundario" onClick={() => window.location.reload()}>
                Recarregar página
              </Botao>
            </>
          ) : erroGeral === "indisponivel" ? (
            <>
              <p id="plano-resumo-erros-titulo" className="font-semibold text-gelo">
                Não conseguimos enviar agora.
              </p>
              <p className="text-cinza-azulado">
                Seus dados continuam aqui. Tente de novo em instantes ou fale com a gente pelo{" "}
                <a href={linkReserva} className="text-ciano underline">
                  WhatsApp
                </a>
                .
              </p>
            </>
          ) : (
            <>
              <p id="plano-resumo-erros-titulo" className="font-semibold text-gelo">
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

      <GrupoOpcoes
        id="plano-plano"
        name="plano"
        legenda="Plano"
        opcoes={OPCOES_PLANO}
        valor={valores.plano}
        aoMudar={(v) => alterar("plano", v)}
        erro={erros.plano}
      />

      <fieldset className="space-y-3" aria-describedby={erros.addons ? "plano-addons-erro" : undefined}>
        <legend className="font-medium text-gelo">
          Add-ons <span className="font-normal text-cinza-azulado">(opcional)</span>
        </legend>
        {addons.map((addon) => (
          <CaixaSelecao
            key={addon.slug}
            id={`plano-addon-${addon.slug}`}
            name="addons"
            value={addon.slug}
            rotulo={addon.nome}
            dica={addon.preco}
            checked={valores.addons.includes(addon.slug)}
            onChange={(e) => alternarAddon(addon.slug, e.target.checked)}
          />
        ))}
        {erros.addons && (
          <p id="plano-addons-erro" className="text-sm font-medium text-erro">
            {erros.addons}
          </p>
        )}
      </fieldset>

      <div className="grid gap-6 sm:grid-cols-2">
        <CampoTexto
          id="plano-nome"
          name="nome"
          rotulo="Nome"
          autoComplete="name"
          maxLength={120}
          value={valores.nome}
          onChange={(e) => alterar("nome", e.target.value)}
          erro={erros.nome}
        />
        <CampoTexto
          id="plano-email"
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
          id="plano-whatsapp"
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
          id="plano-empresa"
          name="empresa"
          rotulo="Empresa ou negócio"
          autoComplete="organization"
          maxLength={120}
          opcional
          value={valores.empresa}
          onChange={(e) => alterar("empresa", e.target.value)}
          erro={erros.empresa}
        />
        <CampoTexto
          id="plano-cidade"
          name="cidade"
          rotulo="Cidade"
          dica="Ex.: Rio Branco/AC"
          autoComplete="address-level2"
          maxLength={80}
          opcional
          value={valores.cidade}
          onChange={(e) => alterar("cidade", e.target.value)}
          erro={erros.cidade}
        />
        <CampoTexto
          id="plano-segmento"
          name="segmento"
          rotulo="Segmento"
          dica="Ex.: saúde, oficina, loja"
          maxLength={80}
          opcional
          value={valores.segmento}
          onChange={(e) => alterar("segmento", e.target.value)}
          erro={erros.segmento}
        />
      </div>

      <CampoAreaTexto
        id="plano-descricao"
        name="descricao"
        rotulo="O que você precisa"
        dica="Entre 10 e 2.000 caracteres."
        rows={3}
        maxLength={2000}
        value={valores.descricao}
        onChange={(e) => alterar("descricao", e.target.value)}
        erro={erros.descricao}
      />

      <CaixaSelecao
        id="plano-marketing_optin"
        name="marketing_optin"
        rotulo="Quero receber novidades da AplicarOn por e-mail."
        dica="Opcional. Você pode cancelar quando quiser."
        checked={valores.marketing_optin}
        onChange={(e) => alterar("marketing_optin", e.target.checked)}
      />
      <p className="text-sm text-cinza-azulado">
        Usaremos seus dados para responder a este pedido. Saiba mais na{" "}
        <Link href="/privacidade" target="_blank" className="text-ciano underline underline-offset-2">
          política de privacidade<span className="sr-only"> (abre em nova aba)</span>
        </Link>
        .
      </p>

      {/* Honeypot: invisível para pessoas e fora da ordem do Tab. */}
      <div aria-hidden className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label htmlFor="plano-site">Não preencha este campo</label>
        <input ref={honeypot} id="plano-site" name="site" type="text" tabIndex={-1} autoComplete="off" defaultValue="" />
      </div>

      <Botao type="submit" disabled={enviando}>
        {enviando ? "Enviando…" : "Enviar e abrir o WhatsApp"}
      </Botao>
      <p role="status" className="sr-only">
        {enviando ? "Enviando seu pedido…" : ""}
      </p>
    </form>
  );
}
