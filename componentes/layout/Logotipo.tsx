import Image from "next/image";
import logotipo from "@/public/imagens/marca/logotipo.png";

// Logotipo "AplicarOn" (gerado de assets/ por scripts/otimizar-imagens.mjs).
// Import estático: o Next conhece largura/altura no build, então a imagem nunca faz a
// página "pular" ao carregar (CLS zero), e serve WebP/AVIF no tamanho certo.
export function Logotipo({ altura = 32, prioridade = false }: { altura?: number; prioridade?: boolean }) {
  const largura = Math.round((logotipo.width / logotipo.height) * altura);
  return (
    <Image
      src={logotipo}
      alt="AplicarOn"
      width={largura}
      height={altura}
      priority={prioridade}
      sizes={`${largura}px`}
    />
  );
}
