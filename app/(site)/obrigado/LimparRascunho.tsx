"use client";

import { useEffect } from "react";
import { apagarRascunho } from "../diagnostico/rascunho";

// Chegar em /obrigado = envio confirmado. Apaga o rascunho para o próximo
// diagnóstico começar do zero, com um submission_id novo.
export function LimparRascunho() {
  useEffect(() => apagarRascunho(), []);
  return null;
}
