import Image, { type StaticImageData } from "next/image";

// Captura de tela de um sistema, com legenda. Usada nos MDX de clientes
// (a imagem vem por import estático: o next/image já sabe largura e altura).
// `largura`: recortes estreitos não são esticados até a largura do texto
// ("celular" para tela vertical de celular, "media" para um trecho de tela).
const LARGURAS = {
  total: { figura: "my-8", sizes: "(min-width: 48rem) 48rem, 100vw" },
  media: { figura: "my-8 max-w-md", sizes: "28rem" },
  celular: { figura: "my-8 max-w-72", sizes: "18rem" },
};

export function Tela({
  src,
  alt,
  legenda,
  largura = "total",
}: {
  src: StaticImageData;
  alt: string;
  legenda: string;
  largura?: keyof typeof LARGURAS;
}) {
  const { figura, sizes } = LARGURAS[largura];
  return (
    <figure className={figura}>
      <Image src={src} alt={alt} sizes={sizes} className="h-auto w-full rounded-lg border border-linha" />
      <figcaption className="mt-3 text-sm text-cinza-azulado">{legenda}</figcaption>
    </figure>
  );
}
