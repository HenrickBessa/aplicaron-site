import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { ambienteSupabasePublico, OPCOES_COOKIE_SESSAO } from "@/lib/sessao";

// Cliente com a chave PUBLISHABLE + a sessão do usuário (cookies).
// - No banco vira o papel `authenticated` do usuário logado: quem decide o que ele vê é o RLS,
//   com privado.admin_mfa() (precisa estar em `admins` E ter passado pelo MFA).
// - Usado só pelo admin (lib/dal e as Server Actions do /admin). O site público não tem sessão.
export async function clienteServidor() {
  // cookies() antes de tudo: é o que diz ao Next que a página é dinâmica. Lendo o ambiente
  // primeiro, o `next build` tentava pré-renderizar /admin e quebrava sem as variáveis.
  const loja = await cookies();
  const { url, chave } = ambienteSupabasePublico();

  return createServerClient(url, chave, {
    cookieOptions: OPCOES_COOKIE_SESSAO,
    cookies: {
      getAll: () => loja.getAll(),
      setAll(lista) {
        // Server Component não pode gravar cookie (lança erro). Não tem problema: o proxy já
        // renovou a sessão nesta requisição. Em Server Action a gravação funciona.
        try {
          for (const { name, value, options } of lista) loja.set(name, value, options);
        } catch {}
      },
    },
  });
}
