// Além do componente padrão (tipado por @types/mdx), todo MDX de conteudo/ exporta `dados`.
// Fica como `unknown` de propósito: quem importa valida com Zod (ver conteudo/esquemas.ts).
declare module "*.mdx" {
  export const dados: unknown;
}
