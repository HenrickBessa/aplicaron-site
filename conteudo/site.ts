// Dados institucionais usados no cabeçalho, rodapé, mensagens de erro e (fatia 6) JSON-LD.
export const site = {
  nome: "AplicarOn",
  slogan: "Sites, sistemas, aplicativos e automação com IA.",
  email: "suporte@aplicaron.com.br",
  whatsapp: "+5547988800836", // formato E.164
} as const;

// URL pública canônica, sem barra no fim. Base de canonical, Open Graph, sitemap e JSON-LD.
// Em Preview também aponta para a produção: cópias em URLs de preview se declaram duplicatas dela.
export const URL_SITE = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.aplicaron.com.br").replace(/\/$/, "");

export const linkWhatsapp = `https://wa.me/${site.whatsapp.replace(/\D/g, "")}`;

// Abre a conversa já com uma mensagem, para a pessoa não começar do zero.
export const linkWhatsappCom = (texto: string) => `${linkWhatsapp}?text=${encodeURIComponent(texto)}`;

// Usado pelo botão flutuante.
export const linkWhatsappComMensagem = linkWhatsappCom("Olá, AplicarOn! Vim pelo site e quero conversar sobre um projeto.");

export const navegacao = [
  { href: "/planos", rotulo: "Planos" },
  { href: "/produtos", rotulo: "Produtos" },
  { href: "/#servicos", rotulo: "Serviços" },
  { href: "/clientes", rotulo: "Clientes" },
  { href: "/sobre", rotulo: "Sobre" },
] as const;

export const chamadaPrincipal = { href: "/diagnostico", rotulo: "Diagnóstico gratuito" } as const;
