"use client";

import { useActionState } from "react";
import { Botao } from "@/componentes/ui/Botao";
import { CampoSelecao, MensagemErro } from "@/componentes/ui/campos";
import { ROTULOS_STATUS, STATUS_LEAD, type StatusLead } from "@/lib/validacao/enums";
import { mudarStatus } from "./acoes";

const OPCOES = STATUS_LEAD.map((valor) => ({ valor, rotulo: ROTULOS_STATUS[valor] }));

export function FormularioStatus({ leadId, status, versao }: { leadId: string; status: StatusLead; versao: number }) {
  const [resultado, acao, enviando] = useActionState(mudarStatus, null);

  return (
    <form action={acao} className="space-y-3">
      <input type="hidden" name="lead_id" value={leadId} />
      <input type="hidden" name="versao" value={versao} />
      <div className="flex flex-wrap items-end gap-4">
        {/* key: quando a versão muda (status salvo), a lista volta a mostrar o status do banco. */}
        <CampoSelecao key={versao} id="status" name="status" rotulo="Status" opcoes={OPCOES} defaultValue={status} />
        <Botao type="submit" disabled={enviando}>
          {enviando ? "Salvando…" : "Salvar status"}
        </Botao>
      </div>
      <div role="alert">
        {resultado && "erro" in resultado && <MensagemErro id="status-erro">{resultado.erro}</MensagemErro>}
      </div>
      <p role="status" className="text-sm text-cinza-azulado">
        {resultado && "ok" in resultado && resultado.ok}
      </p>
    </form>
  );
}
