import Image, { type StaticImageData } from "next/image";

// Captura de tela de um sistema, com legenda. Usada nos MDX de clientes
// (a imagem vem por import estático: o next/image já sabe largura e altura).
export function Tela({ src, alt, legenda }: { src: StaticImageData; alt: string; legenda: string }) {
  return (
    <figure className="my-8">
      <Image
        src={src}
        alt={alt}
        sizes="(min-width: 48rem) 48rem, 100vw"
        className="h-auto w-full rounded-lg border border-linha"
      />
      <figcaption className="mt-3 text-sm text-cinza-azulado">{legenda}</figcaption>
    </figure>
  );
}
