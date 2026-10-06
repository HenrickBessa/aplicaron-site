import { NextResponse, type NextRequest } from "next/server";

// Proxy (Next 16; substitui o middleware.ts). Roda SÓ em /admin (matcher abaixo).
// Papel na Fase 2: renovar a sessão do Supabase e fazer redirect otimista para o login.
// Regra permanente: o proxy NUNCA lê tabela nem decide acesso a dado. Quem decide é
// lib/dal (exigirAdmin) e, no banco, o RLS com privado.admin_mfa().
// Fase 1: não existe /admin, então apenas deixa a requisição seguir (vira 404).
export function proxy(request: NextRequest) {
  void request;
  return NextResponse.next();
}

export const config = {
  matcher: "/admin/:path*",
};
