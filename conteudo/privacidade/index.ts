import { carregar, dadosPoliticaSchema } from "@/conteudo/esquemas";
import * as v20261005 from "./2026-10-05.mdx";

// Versões da política, da mais nova para a mais antiga. Versões antigas NUNCA são apagadas:
// cada lead grava `politica_versao`, e precisamos saber exatamente o que ele viu.
// Para publicar uma nova versão: crie AAAA-MM-DD.mdx e coloque-a no topo da lista.
export const versoesPolitica = [carregar(dadosPoliticaSchema, "2026-10-05", v20261005)];

export const politicaVigente = versoesPolitica[0];

// Gravado em leads.politica_versao pelo formulário de diagnóstico (fatia 4).
export const VERSAO_POLITICA_VIGENTE = politicaVigente.dados.versao;
