import type { StaticImageData } from "next/image";
import { carregar, dadosClienteSchema } from "@/conteudo/esquemas";
import logoAtacado from "@/public/imagens/clientes/atacado-das-cestas.png";
import logoEmer from "@/public/imagens/clientes/emer.png";
import logoKavana from "@/public/imagens/clientes/kavana.png";
import * as atacado from "./atacado-das-cestas.mdx";
import * as emer from "./emer.mdx";
import * as kavana from "./kavana.mdx";

// Para adicionar um cliente: crie o .mdx nesta pasta, gere o logo com `npm run imagens`
// e acrescente uma linha abaixo. A chave é o slug da URL (/clientes/<slug>).
const comLogo = <T extends object>(item: T, logo: StaticImageData) => ({ ...item, logo });

export const clientes = [
  comLogo(carregar(dadosClienteSchema, "emer", emer), logoEmer),
  comLogo(carregar(dadosClienteSchema, "atacado-das-cestas", atacado), logoAtacado),
  comLogo(carregar(dadosClienteSchema, "kavana", kavana), logoKavana),
].sort((a, b) => a.dados.ordem - b.dados.ordem);

export type Cliente = (typeof clientes)[number];

export function buscarCliente(slug: string) {
  return clientes.find((c) => c.slug === slug);
}
