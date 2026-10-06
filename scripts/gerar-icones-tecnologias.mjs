// Gera conteudo/icones-tecnologias.gerado.ts só com os ícones (ICONES.<nome>) usados nos
// arquivos listados em ORIGENS (carrossel de tecnologias e botão do WhatsApp).
// Rode: npm run icones (sempre que mudar a lista de tecnologias).
//
// Por quê: o pacote simple-icons tem um arquivo único de 5 MB com 3.000+ ícones. Importá-lo no
// site trava o `npm run dev` (o Turbopack processa o arquivo inteiro). Copiamos só os necessários.
import { readFile, writeFile } from "node:fs/promises";
import * as si from "simple-icons";

const ORIGENS = ["conteudo/tecnologias.ts", "componentes/layout/WhatsappFlutuante.tsx"];
const textos = await Promise.all(ORIGENS.map((arquivo) => readFile(arquivo, "utf8")));
const usados = [...new Set(textos.flatMap((t) => [...t.matchAll(/ICONES\.(\w+)/g)].map((m) => m[1])))].sort();

const icones = usados.map((chave) => {
  const icone = si[`si${chave[0].toUpperCase()}${chave.slice(1)}`];
  if (!icone) throw new Error(`Ícone "${chave}" não existe no simple-icons (veja https://simpleicons.org).`);
  return `  ${chave}: { titulo: ${JSON.stringify(icone.title)}, hex: "${icone.hex}", path: ${JSON.stringify(icone.path)} },`;
});

await writeFile(
  "conteudo/icones-tecnologias.gerado.ts",
  `// GERADO por scripts/gerar-icones-tecnologias.mjs — não edite à mão (rode: npm run icones).
// Ícones: Simple Icons (https://simpleicons.org), licença CC0.
export type IconeTecnologia = { titulo: string; hex: string; path: string };

export const ICONES = {
${icones.join("\n")}
} satisfies Record<string, IconeTecnologia>;
`,
);
console.log(`${usados.length} ícones gerados.`);
