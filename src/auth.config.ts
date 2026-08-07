import type { NextAuthConfig } from 'next-auth';
import { UserRole } from '@/types/roles';

export const authConfig = {
  providers: [],
  pages: {
    signIn: "/welcome",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role as UserRole;
      }
      return token;
    },
    async session({ session, user, token }) {
      // Com PrismaAdapter, a sessão sempre usa "database" strategy.
      // O objeto `user` (do BD) está disponível diretamente aqui.
      // Se usarmos JWT, o user será recebido no jwt() e repassado via token
      if (session.user) {
        if (user) {
          session.user.id = user.id;
          session.user.role = user.role as UserRole;
        } else if (token) {
          session.user.id = token.sub as string;
          session.user.role = token.role as UserRole;
        }
      }
      return session;
    },
  },
  // IMPORTANTE: Não definir session.strategy aqui.
  // O PrismaAdapter em auth.ts força "database" automaticamente.
  // Definir "jwt" + adapter = erro de Configuration no Resend/Magic Link.
} satisfies NextAuthConfig;
