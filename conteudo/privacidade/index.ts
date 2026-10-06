import { carregar, dadosPoliticaSchema } from "@/conteudo/esquemas";
import * as v20261005 from "./2026-10-05.mdx";
import * as v20261006 from "./2026-10-06.mdx";
import * as v20261006b from "./2026-10-06-2.mdx";

// Versões da política, da mais nova para a mais antiga. Versões antigas NUNCA são apagadas:
// cada lead grava `politica_versao`, e precisamos saber exatamente o que ele viu.
// Para publicar uma nova versão: crie AAAA-MM-DD.mdx e coloque-a no topo da lista.
// Duas versões no mesmo dia: a segunda recebe o sufixo "-2" (AAAA-MM-DD-N).
export const versoesPolitica = [
  carregar(dadosPoliticaSchema, "2026-10-06-2", v20261006b), // contato: suporte@aplicaron.com.br
  carregar(dadosPoliticaSchema, "2026-10-06", v20261006), // contato: e-mail pessoal (publicada por poucas horas)
  carregar(dadosPoliticaSchema, "2026-10-05", v20261005),
];

export const politicaVigente = versoesPolitica[0];

// Gravado em leads.politica_versao pelo formulário de diagnóstico.
export const VERSAO_POLITICA_VIGENTE = politicaVigente.dados.versao;
