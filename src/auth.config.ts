/* eslint-disable @typescript-eslint/no-explicit-any */
import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
  providers: [],
  pages: {
    signIn: "/welcome",
  },
  session: {
    // CRÍTICO: O PrismaAdapter força estratégia "database".
    // O middleware (proxy.ts) usa uma instância leve do NextAuth sem adapter.
    // Sem declarar explicitamente "database" aqui, o middleware tenta
    // descriptografar o session token como JWE → erro JWEInvalid.
    strategy: "database" as const,
  },
  callbacks: {
    async session({ session, user }) {
      // Com PrismaAdapter, a sessão sempre usa "database" strategy.
      // O objeto `user` (do BD) está disponível diretamente aqui.
      if (session.user && user) {
        session.user.id = user.id;
        (session.user as any).role = (user as any).role;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
