/* eslint-disable @typescript-eslint/no-explicit-any */
import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
  providers: [],
  pages: {
    signIn: "/welcome",
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
  // IMPORTANTE: Não definir session.strategy aqui.
  // O PrismaAdapter em auth.ts força "database" automaticamente.
  // Definir "jwt" + adapter = erro de Configuration no Resend/Magic Link.
} satisfies NextAuthConfig;
