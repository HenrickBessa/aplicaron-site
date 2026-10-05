import createMDX from "@next/mdx";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {};

// Permite importar arquivos .mdx de conteudo/ como componentes React.
// Não adicionamos "mdx" em pageExtensions: nenhum MDX vira rota sozinho;
// as páginas em app/ importam o conteúdo explicitamente.
const withMDX = createMDX({});

export default withMDX(nextConfig);
