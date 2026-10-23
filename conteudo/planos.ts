import type { Addon, Plano, Servico } from "@/lib/validacao/enums";

// Fonte única dos planos: a página /planos, o formulário e a mensagem do WhatsApp leem daqui.
// Mudar preço = editar uma linha. Valores em reais, inteiros.
// Preço só vai ao ar com o ok do Henrick: o PR fica como rascunho no GitHub até lá.

export type DadosPlano = {
  slug: Plano;
  nome: string;
  resumo: string;
  // "a partir de"
  implantacao: number;
  mensalidade: number;
  // Complemento do preço mensal (ex.: "por unidade"). Vazio quando não há.
  mensalidadeDetalhe?: string;
  // null = prazo combinado depois de conhecer a operação.
  prazoDiasUteis: { de: number; ate: number } | null;
  inclui: string[];
  naoInclui: string[];
  destaque: boolean;
  // Mensagem do link direto para o WhatsApp (sem formulário: sem JavaScript ou quando o envio falha).
  mensagemWhatsApp: string;
  // Tipo de serviço gravado no lead (o CRM continua filtrando por serviço).
  servico: Exclude<Servico, "outro">;
  // Página própria do produto, quando existe.
  pagina?: string;
};

export const planos: DadosPlano[] = [
  {
    slug: "presenca",
    nome: "Presença",
    resumo: "Site profissional para o seu negócio ser encontrado e receber contatos pelo WhatsApp.",
    implantacao: 900,
    mensalidade: 90,
    prazoDiasUteis: { de: 10, ate: 10 },
    inclui: [
      "Site institucional com até 5 páginas",
      "Formulário que chega no seu WhatsApp",
      "SEO básico para aparecer no Google",
      "Domínio e hospedagem configurados",
    ],
    naoInclui: ["Catálogo de produtos ou serviços", "Painel para editar o conteúdo"],
    destaque: false,
    mensagemWhatsApp: "Olá, AplicarOn! Vim pelo site e quero o plano Presença.",
    servico: "sites",
  },
  {
    slug: "vende",
    nome: "Vende",
    resumo: "Tudo do Presença, mais uma vitrine do que você vende e um painel para você mesmo atualizar.",
    implantacao: 1800,
    mensalidade: 150,
    prazoDiasUteis: { de: 15, ate: 20 },
    inclui: [
      "Tudo do plano Presença",
      "Catálogo com faixa de preço, simulador ou página de empreendimento",
      "Painel simples para você editar",
    ],
    naoInclui: ["Agendamento online", "Cobrança automática"],
    destaque: true,
    mensagemWhatsApp: "Olá, AplicarOn! Vim pelo site e quero o plano Vende.",
    servico: "sites",
  },
  {
    slug: "agenda_cobranca",
    nome: "Agenda + Cobrança",
    resumo: "Agenda online com lembrete no WhatsApp e cobrança automática de quem atrasou, ligada ao seu Asaas.",
    implantacao: 700,
    mensalidade: 220,
    mensalidadeDetalhe: "por unidade (desconto a partir da 3ª)",
    prazoDiasUteis: null,
    inclui: [
      "Agendamento online",
      "Lembrete automático por WhatsApp",
      "Cobrança automática de atrasados pelo Asaas",
      "Com ou sem site",
    ],
    naoInclui: ["Conta no Asaas (fica no nome do seu negócio)"],
    destaque: false,
    mensagemWhatsApp: "Olá, AplicarOn! Vim pelo site e quero o plano Agenda + Cobrança.",
    servico: "sistemas",
    pagina: "/produtos/agenda-cobranca",
  },
];

export type DadosAddon = { slug: Addon; nome: string; preco: string };

// Sempre com mensalidade (ou pacote de horas): nada de valor avulso escondido.
export const addons: DadosAddon[] = [
  { slug: "crm", nome: "CRM: carteira de clientes e controle financeiro", preco: "+ R$ 150/mês" },
  {
    slug: "cobranca_whatsapp",
    nome: "Cobrança por WhatsApp (sem agenda)",
    preco: "Implantação de R$ 500 + R$ 120/mês por loja",
  },
  { slug: "manutencao_4h", nome: "Manutenção evolutiva: pacote de 4 horas", preco: "R$ 400" },
];

// "Como funciona a contratação": vale para todos os planos (briefing, item 5). Bloco em /planos#como-funciona.
export const regrasContratacao: { titulo: string; texto: string }[] = [
  {
    titulo: "O que nenhum plano inclui",
    texto: "Criação de logo, redação de textos (você envia ou contrata à parte), fotos e tráfego pago.",
  },
  { titulo: "Ajustes", texto: "Até 2 rodadas de ajuste por entrega. A partir daí, cobrado por hora." },
  {
    titulo: "Pagamento",
    texto: "50% da implantação na assinatura e 50% na entrega. A mensalidade começa no mês seguinte à publicação.",
  },
  { titulo: "Atraso", texto: "Com a mensalidade 30 dias em atraso, o site ou o painel fica suspenso até regularizar." },
  { titulo: "O que é seu", texto: "O código, os dados e o conhecimento ficam com você." },
];

export function buscarPlano(slug: string) {
  return planos.find((p) => p.slug === slug);
}

const reais = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
export const emReais = (valor: number) => reais.format(valor);

export function textoPrazo(prazo: DadosPlano["prazoDiasUteis"]) {
  if (!prazo) return "Prazo combinado depois de conhecer a sua operação";
  return prazo.de === prazo.ate ? `${prazo.de} dias úteis` : `${prazo.de} a ${prazo.ate} dias úteis`;
}

type DadosMensagem = {
  plano: Plano;
  addons: Addon[];
  empresa?: string;
  cidade?: string;
  segmento?: string;
  descricao: string;
};

// Texto que abre no WhatsApp da AplicarOn. Sai do que a pessoa digitou e já foi validado no servidor.
export function mensagemWhatsappPlano(dados: DadosMensagem) {
  const plano = buscarPlano(dados.plano)!;
  const nomesAddons = dados.addons.map((a) => addons.find((x) => x.slug === a)!.nome.split(":")[0]);
  const negocio = [dados.empresa, dados.cidade, dados.segmento].filter(Boolean).join(" — ");
  return [
    "Olá, AplicarOn! Vim pelo site.",
    `Plano: ${plano.nome}`,
    nomesAddons.length > 0 && `Add-ons: ${nomesAddons.join(", ")}`,
    negocio && `Negócio: ${negocio}`,
    `Preciso de: ${dados.descricao}`,
  ]
    .filter(Boolean)
    .join("\n");
}
