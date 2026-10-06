import { z } from "zod";

// Ponto único de importação do Zod no projeto.
// jitless: o Zod 4 testa se pode usar `new Function()` (eval) para acelerar validações.
// Nossa CSP não permite eval, então o teste vira uma violação relatada em todo visitante.
// Desligar o JIT remove o teste; a diferença de desempenho é irrelevante para um formulário.
// A opção é lida quando cada esquema é criado: este módulo precisa ser importado antes.
z.config({ jitless: true });

export { z };
