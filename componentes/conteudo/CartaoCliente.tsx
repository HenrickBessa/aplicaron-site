import Image from "next/image";
import Link from "next/link";
import type { Cliente } from "@/conteudo/clientes";
import { ROTULOS_SERVICO } from "@/lib/validacao/enums";

// Cartão clicável de cliente (home e /clientes). O cartão inteiro é um link para o case;
// o nome acessível do link é o título do case (h3).
export function CartaoCliente({ cliente, nivelTitulo = "h3" }: { cliente: Cliente; nivelTitulo?: "h2" | "h3" }) {
  const { slug, dados, logo } = cliente;
  const Titulo = nivelTitulo;
  return (
    <Link
      href={`/clientes/${slug}`}
      className="cartao-interativo group flex h-full flex-col overflow-hidden rounded-xl border border-linha bg-azul-profundo"
    >
      <div className="flex h-40 items-center justify-center bg-azul-noite/70 p-6">
        <Image
          src={logo}
          alt={`Logo ${dados.cliente}`}
          className="h-24 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
          sizes="200px"
        />
      </div>
      <div className="flex flex-1 flex-col gap-3 p-6">
        <p className="text-sm text-cinza-azulado">
          {dados.setor} · {dados.cidade}
        </p>
        <Titulo className="text-xl font-semibold text-gelo group-hover:text-ciano">{dados.titulo}</Titulo>
        <p className="text-cinza-azulado">{dados.resumo}</p>
        <ul className="mt-auto flex flex-wrap gap-2 pt-2" aria-label="Serviços entregues">
          {dados.servicos.map((s) => (
            <li key={s} className="rounded-full border border-borda-campo px-3 py-1 text-xs text-gelo">
              {ROTULOS_SERVICO[s]}
            </li>
          ))}
        </ul>
        <span className="text-sm font-medium text-ciano" aria-hidden>
          Ver o projeto →
        </span>
      </div>
    </Link>
  );
}
