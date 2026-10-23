"use client";

import { useActionState, useState, useTransition } from "react";
import { Botao } from "@/componentes/ui/Botao";
import { CampoTexto, MensagemErro } from "@/componentes/ui/campos";
import { confirmarMfa, iniciarCadastroMfa, type CadastroMfa } from "../acoes";

export function FormularioMfa({ cadastrado }: { cadastrado: boolean }) {
  const [resultado, acao, enviando] = useActionState(confirmarMfa, null);
  const [cadastro, setCadastro] = useState<CadastroMfa>(null);
  const [gerando, iniciar] = useTransition();

  const qrPronto = cadastro && "qr" in cadastro;
  const mostrarCodigo = cadastrado || qrPronto;

  return (
    <div className="mt-6 space-y-6">
      {!cadastrado && !qrPronto && (
        <Botao disabled={gerando} onClick={() => iniciar(async () => setCadastro(await iniciarCadastroMfa()))}>
          {gerando ? "Gerando…" : "Gerar QR code"}
        </Botao>
      )}

      {qrPronto && (
        <div className="space-y-3">
          <p>1. Leia o QR code com o app autenticador.</p>
          {/* QR gerado pelo Supabase (SVG em data: URI). next/image não serve: não é arquivo estático. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={cadastro.qr} alt="QR code para cadastrar a conta no app autenticador" className="size-48 rounded-lg bg-gelo p-2" />
          <p className="text-sm text-cinza-azulado">
            Sem câmera? Digite esta chave no app: <code data-testid="segredo-totp" className="break-all text-gelo">{cadastro.segredo}</code>
          </p>
          <p>2. Digite abaixo o código que o app mostrar.</p>
        </div>
      )}

      <div role="alert">
        {cadastro && "erro" in cadastro && <MensagemErro id="cadastro-erro">{cadastro.erro}</MensagemErro>}
      </div>

      {mostrarCodigo && (
        <form action={acao} className="space-y-5">
          <CampoTexto
            id="codigo"
            name="codigo"
            rotulo="Código de 6 números"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={7}
          />
          <div role="alert">{resultado?.erro && <MensagemErro id="codigo-erro">{resultado.erro}</MensagemErro>}</div>
          <Botao type="submit" disabled={enviando} className="w-full">
            {enviando ? "Conferindo…" : "Confirmar"}
          </Botao>
        </form>
      )}
    </div>
  );
}
