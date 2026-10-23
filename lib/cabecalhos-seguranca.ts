import { createHash } from "node:crypto";

// Cabeçalhos de segurança aplicados a todas as respostas (via next.config.ts).
// Fica em arquivo próprio para os testes conferirem exatamente o que vai para produção.

// Script inline do app/layout.tsx: aplica a preferência "Pausar animações" (BotaoAnimacoes) ANTES
// da primeira pintura, para as animações não rodarem por um instante ao recarregar (mesmo padrão
// do modo escuro). Fica aqui porque a CSP do admin libera exatamente este texto, pelo hash: o
// layout raiz é estático e não tem como receber o nonce. Mudou o texto, o hash muda junto.
export const SCRIPT_PREFERENCIAS = `try{if(localStorage.getItem("aplicaron:animacoes")==="pausadas")document.documentElement.dataset.animacoes="pausadas"}catch(e){}`;
const HASH_SCRIPT_PREFERENCIAS = `'sha256-${createHash("sha256").update(SCRIPT_PREFERENCIAS).digest("base64")}'`;

// Diretivas iguais nas duas CSPs (site público e admin).
const DIRETIVAS_COMUNS = [
  "font-src 'self'",
  "img-src 'self' data: blob:",
  // O Sentry no navegador envia pelo túnel /monitoring (mesmo domínio): connect-src fica 'self'.
  "connect-src 'self'",
  "frame-src 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
];

function montar(diretivas: string[], urlRelatorio?: string) {
  return [...diretivas, ...DIRETIVAS_COMUNS, ...(urlRelatorio ? [`report-uri ${urlRelatorio}`] : [])].join("; ");
}

// CSP das páginas públicas, SEM nonce (páginas estáticas não têm como gerar um nonce por
// requisição). Por isso script-src precisa de 'unsafe-inline': o Next injeta scripts inline
// para hidratar a página. Começa em Report-Only: o navegador só RELATA o que seria bloqueado.
export function cspRelatorio(urlRelatorio?: string) {
  return montar(
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",
      // Folhas de estilo e blocos <style> só do próprio site. Atributos style="..." liberados:
      // o next/image sempre escreve style="color:transparent" nas imagens (medido pelo E2E).
      // Estilo inline não executa código; o risco é bem menor que o de script inline.
      "style-src 'self'",
      "style-src-attr 'unsafe-inline'",
    ],
    urlRelatorio,
  );
}

// CSP do /admin, COM nonce e sem 'unsafe-inline'. As páginas do admin são dinâmicas, então o
// proxy.ts gera um nonce por requisição; o Next lê o nonce deste cabeçalho na requisição e o
// põe nos scripts e estilos que ele gera. 'strict-dynamic': scripts carregados por um script
// com nonce também valem (os pedaços de JavaScript que o Next carrega depois).
// Também em Report-Only por enquanto, como a pública (aplicar é decisão do Henrick).
export function cspAdmin(nonce: string, urlRelatorio?: string) {
  return montar(
    [
      "default-src 'self'",
      `script-src 'self' 'nonce-${nonce}' ${HASH_SCRIPT_PREFERENCIAS} 'strict-dynamic'`,
      `style-src 'self' 'nonce-${nonce}'`,
    ],
    urlRelatorio,
  );
}

// cspPublica: false no /admin, que recebe a CSP com nonce pelo proxy.ts.
export function cabecalhosSeguranca({
  producao,
  cspPublica = true,
  urlRelatorioCsp,
}: {
  producao: boolean;
  cspPublica?: boolean;
  urlRelatorioCsp?: string;
}) {
  const cabecalhos = [
    // Só HTTPS por 2 anos, inclusive subdomínios (a Vercel já envia; fica explícito aqui).
    { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
    // O navegador não "adivinha" o tipo de um arquivo (evita executar um upload como script).
    { key: "X-Content-Type-Options", value: "nosniff" },
    // Outros sites só recebem a origem (sem caminho nem ?servico=...) quando alguém clica num link.
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    // Nenhuma API sensível do navegador está liberada para o site.
    {
      key: "Permissions-Policy",
      value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=(), interest-cohort=()",
    },
    // Ninguém pode embutir o site num iframe (clickjacking). frame-ancestors é IGNORADO em
    // CSP Report-Only, por isso vai numa CSP aplicada separada. X-Frame-Options cobre navegadores antigos.
    { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
    { key: "X-Frame-Options", value: "DENY" },
  ];
  // Em desenvolvimento o Next usa eval para o recarregamento rápido: a CSP só geraria ruído.
  if (producao && cspPublica) {
    cabecalhos.push({ key: "Content-Security-Policy-Report-Only", value: cspRelatorio(urlRelatorioCsp) });
  }
  return cabecalhos;
}
