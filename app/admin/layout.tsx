import type { Metadata } from "next";
import type { ReactNode } from "react";

// Área restrita: fora do Google (o robots.txt também bloqueia /admin) e sem o layout do site.
export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · Admin AplicarOn" },
  robots: { index: false, follow: false },
};

export default function LayoutAdmin({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh">
      <header className="border-b border-linha">
        <div className="container-site py-4">
          <p className="font-semibold text-gelo">AplicarOn · Admin</p>
        </div>
      </header>
      <main id="conteudo" className="container-site py-10">
        {children}
      </main>
    </div>
  );
}
