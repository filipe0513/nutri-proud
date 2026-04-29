/* eslint-disable @typescript-eslint/no-explicit-any */
import type { NextAuthConfig } from 'next-auth';
import Google from "next-auth/providers/google";
import Resend from "next-auth/providers/resend";

export const authConfig = {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    Resend({
      from: "Nutri Proud <onboarding@resend.dev>",
    }),
  ],
  pages: {
    signIn: "/welcome",
  },
  callbacks: {
    async session({ session, user, token }) {
      if (session.user) {
        if (user) {
          session.user.id = user.id;
          (session.user as any).role = (user as any).role;
        } else if (token) {
          session.user.id = token.sub as string;
          (session.user as any).role = token.role;
        }
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
      }
      return token;
    }
  },
  session: { strategy: "jwt" }
} satisfies NextAuthConfig;
