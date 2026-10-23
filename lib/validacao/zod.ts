import { config } from "zod";

// Ponto único de importação do Zod no projeto. Use: `import * as z from "@/lib/validacao/zod"`.
// jitless: o Zod 4 testa se pode usar `new Function()` (eval) para acelerar validações.
// Nossa CSP não permite eval, então o teste vira uma violação relatada em todo visitante.
// Desligar o JIT remove o teste; a diferença de desempenho é irrelevante para um formulário.
// A opção é lida quando cada esquema é criado: este módulo precisa ser importado antes.
config({ jitless: true });

// Só o que o projeto usa, por nome. O `z` do pacote é um objeto com TUDO, inclusive as
// traduções de ~50 idiomas (`z.locales`), e o Turbopack não consegue descartar partes dele:
// o formulário levava ~90 KB gzip ao navegador. Precisa de outra função? Acrescente aqui.
export {
  array,
  boolean,
  coerce,
  email,
  enum,
  guid,
  literal,
  NEVER,
  number,
  object,
  prettifyError,
  string,
  union,
  url,
  uuid,
  ZodError,
  ZodType,
} from "zod";
export type { infer, input, output } from "zod";
