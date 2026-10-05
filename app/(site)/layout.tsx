import { EstruturaSite } from "@/componentes/layout/EstruturaSite";

// O grupo (site) não aparece na URL: só agrupa as páginas públicas sob o mesmo layout.
export default function LayoutSite({ children }: LayoutProps<"/">) {
  return <EstruturaSite>{children}</EstruturaSite>;
}
