import { NextRequest, NextResponse } from "next/server";

/**
 * Middleware puro Next.js (Edge Runtime compatível).
 *
 * IMPORTANTE: O middleware NÃO usa NextAuth diretamente porque o PrismaAdapter
 * (database session strategy) é incompatível com o Edge Runtime.
 *
 * A validação real de sessão e onboarding ocorre nos Server Components
 * (src/app/(main)/layout.tsx), onde o Prisma funciona normalmente.
 *
 * O middleware apenas faz a guarda mínima de rotas sensíveis verificando
 * a existência do cookie de sessão do Auth.js.
 */
export function proxy(req: NextRequest) {
  const { nextUrl } = req;

  // Checagem de Admin — rota restrita a usuários autenticados
  if (nextUrl.pathname.startsWith("/admin")) {
    // O Auth.js (database strategy) grava o session token neste cookie.
    // Em produção (HTTPS) o prefixo muda para __Secure-.
    const sessionToken =
      req.cookies.get("authjs.session-token")?.value ??
      req.cookies.get("__Secure-authjs.session-token")?.value;

    if (!sessionToken) {
      return NextResponse.redirect(new URL("/welcome", nextUrl));
    }
  }

  return NextResponse.next();
}

export default proxy;

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};

