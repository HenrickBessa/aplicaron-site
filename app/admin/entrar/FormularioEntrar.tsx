"use client";

import { useActionState } from "react";
import { Botao } from "@/componentes/ui/Botao";
import { CampoTexto, MensagemErro } from "@/componentes/ui/campos";
import { entrar } from "../acoes";

export function FormularioEntrar() {
  const [resultado, acao, enviando] = useActionState(entrar, null);

  return (
    <form action={acao} className="mt-6 space-y-5">
      <CampoTexto id="email" name="email" type="email" rotulo="E-mail" autoComplete="username" />
      <CampoTexto id="senha" name="senha" type="password" rotulo="Senha" autoComplete="current-password" />
      {/* role="alert": o leitor de tela anuncia o erro assim que ele aparece. */}
      <div role="alert">{resultado?.erro && <MensagemErro id="entrar-erro">{resultado.erro}</MensagemErro>}</div>
      <Botao type="submit" disabled={enviando} className="w-full">
        {enviando ? "Entrando…" : "Entrar"}
      </Botao>
    </form>
  );
}
