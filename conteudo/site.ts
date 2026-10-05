// Dados institucionais usados no cabeçalho, rodapé, mensagens de erro e (fatia 6) JSON-LD.
export const site = {
  nome: "AplicarOn",
  slogan: "Sites, sistemas, aplicativos e automação com IA.",
  email: "contato@aplicaron.com.br", // RASCUNHO: confirmar o e-mail real antes do lançamento
  whatsapp: "+5547988800836", // formato E.164
} as const;

export const linkWhatsapp = `https://wa.me/${site.whatsapp.replace(/\D/g, "")}`;

export const navegacao = [
  { href: "/#servicos", rotulo: "Serviços" },
  { href: "/#cases", rotulo: "Cases" },
  { href: "/sobre", rotulo: "Sobre" },
] as const;

export const chamadaPrincipal = { href: "/diagnostico", rotulo: "Diagnóstico gratuito" } as const;
