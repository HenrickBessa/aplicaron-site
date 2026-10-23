import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { ambienteSupabasePublico, OPCOES_COOKIE_SESSAO } from "@/lib/sessao";

// Proxy (Next 16; substitui o middleware.ts). Roda SÓ em /admin (matcher abaixo).
// Papel: renovar a sessão do Supabase (o token vence em 1 h e só pode ser trocado uma vez)
// e fazer redirect otimista para o login de quem não tem sessão.
// Regra permanente: o proxy NUNCA lê tabela nem decide acesso a dado. Quem decide é
// lib/dal (exigirAdmin) e, no banco, o RLS com privado.admin_mfa().
export async function proxy(request: NextRequest) {
  const { url, chave } = ambienteSupabasePublico();
  let resposta = NextResponse.next({ request });

  const supabase = createServerClient(url, chave, {
    cookieOptions: OPCOES_COOKIE_SESSAO,
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(lista, cabecalhos) {
        // O token renovado vai para a página desta requisição (request) e para o navegador (resposta).
        for (const { name, value } of lista) request.cookies.set(name, value);
        resposta = NextResponse.next({ request });
        for (const { name, value, options } of lista) resposta.cookies.set(name, value, options);
        // Cabeçalhos de cache da biblioteca: resposta com cookie de sessão nunca fica em cache.
        for (const [nome, valor] of Object.entries(cabecalhos)) resposta.headers.set(nome, valor);
      },
    },
  });

  const { data } = await supabase.auth.getClaims();
  if (!data?.claims && request.nextUrl.pathname !== "/admin/entrar") {
    const redirecionamento = NextResponse.redirect(new URL("/admin/entrar", request.url));
    // Leva junto o que a biblioteca gravou (ex.: apagar os cookies de uma sessão que não renova mais).
    for (const cookie of resposta.cookies.getAll()) redirecionamento.cookies.set(cookie);
    return redirecionamento;
  }
  return resposta;
}

export const config = {
  matcher: "/admin/:path*",
};
