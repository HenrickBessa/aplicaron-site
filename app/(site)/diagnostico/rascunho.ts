// Rascunho do formulário no sessionStorage do navegador.
// - Só esta aba enxerga; some ao fechar a aba; é apagado no sucesso (página /obrigado).
// - Guarda o submission_id (reenvio após recarregar não duplica o lead) e os valores
//   digitados (recarregar a página, inclusive após um deploy, não perde o que foi escrito).
// - Todo acesso fica em try/catch: modo privado ou armazenamento bloqueado não podem
//   quebrar o formulário; ele só perde a capacidade de restaurar.

const CHAVE = "aplicaron:diagnostico";

export type ValoresFormulario = {
  servico: string;
  faixa_orcamento: string;
  descricao: string;
  nome: string;
  email: string;
  whatsapp: string;
  empresa: string;
  marketing_optin: boolean;
};

export type Rastreio = {
  pagina_origem?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
};

export type Rascunho = {
  submission_id: string;
  etapa: 1 | 2 | 3;
  valores: ValoresFormulario;
  rastreio: Rastreio;
};

export function lerRascunho(): Rascunho | null {
  try {
    const texto = sessionStorage.getItem(CHAVE);
    return texto ? (JSON.parse(texto) as Rascunho) : null;
  } catch {
    return null;
  }
}

export function salvarRascunho(rascunho: Rascunho) {
  try {
    sessionStorage.setItem(CHAVE, JSON.stringify(rascunho));
  } catch {
    // sem armazenamento: segue sem restaurar
  }
}

export function apagarRascunho() {
  try {
    sessionStorage.removeItem(CHAVE);
  } catch {
    // nada a fazer
  }
}
