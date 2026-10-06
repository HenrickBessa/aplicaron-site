// Cabeçalhos de segurança aplicados a todas as respostas (via next.config.ts).
// Fica em arquivo próprio para os testes conferirem exatamente o que vai para produção.

// CSP das páginas públicas, SEM nonce (páginas estáticas não têm como gerar um nonce por
// requisição). Por isso script-src precisa de 'unsafe-inline': o Next injeta scripts inline
// para hidratar a página. Começa em Report-Only: o navegador só RELATA o que seria bloqueado.
// CSP com nonce (sem 'unsafe-inline') fica para o admin, na Fase 2.
export function cspRelatorio(urlRelatorio?: string) {
  const diretivas = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'",
    // Folhas de estilo e blocos <style> só do próprio site. Atributos style="..." liberados:
    // o next/image sempre escreve style="color:transparent" nas imagens (medido pelo E2E).
    // Estilo inline não executa código; o risco é bem menor que o de script inline.
    "style-src 'self'",
    "style-src-attr 'unsafe-inline'",
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
  if (urlRelatorio) diretivas.push(`report-uri ${urlRelatorio}`);
  return diretivas.join("; ");
}

export function cabecalhosSeguranca({ producao, urlRelatorioCsp }: { producao: boolean; urlRelatorioCsp?: string }) {
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
  if (producao) {
    cabecalhos.push({ key: "Content-Security-Policy-Report-Only", value: cspRelatorio(urlRelatorioCsp) });
  }
  return cabecalhos;
}
