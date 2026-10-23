"use client";

import { useActionState } from "react";
import { Botao } from "@/componentes/ui/Botao";
import { CampoAreaTexto, MensagemErro } from "@/componentes/ui/campos";
import { adicionarNota } from "./acoes";

export function FormularioNota({ leadId }: { leadId: string }) {
  const [resultado, acao, enviando] = useActionState(adicionarNota, null);
  const erro = resultado && "erro" in resultado ? resultado : null;

  return (
    <form action={acao} className="space-y-3">
      <input type="hidden" name="lead_id" value={leadId} />
      <CampoAreaTexto
        id="texto"
        name="texto"
        rotulo="Nova nota"
        rows={4}
        maxLength={5000}
        defaultValue={erro?.texto}
      />
      <div role="alert">{erro && <MensagemErro id="nota-erro">{erro.erro}</MensagemErro>}</div>
      <p role="status" className="text-sm text-cinza-azulado">
        {resultado && "ok" in resultado && resultado.ok}
      </p>
      <Botao type="submit" disabled={enviando}>
        {enviando ? "Salvando…" : "Adicionar nota"}
      </Botao>
    </form>
  );
}
