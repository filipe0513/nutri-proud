import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"
import { authConfig } from "./auth.config"
import { cookies } from "next/headers"

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ user, account, profile }) {
      // Lógica de Upgrade (O "Merge")
      const cookieStore = await cookies();
      const anonUserId = cookieStore.get('anon_user_id')?.value;
      
      if (anonUserId) {
        const realUserId = user.id;

        if (realUserId && realUserId !== anonUserId) {
          try {
            const anonUser = await prisma.user.findUnique({
              where: { id: anonUserId, is_anonymous: true }
            });

            if (anonUser) {
              await prisma.dailyLog.updateMany({
                where: { userId: anonUserId },
                data: { userId: realUserId }
              });

              await prisma.user.delete({
                where: { id: anonUserId }
              });
            }
          } catch (e) {
            console.error('Falha ao migrar dados anônimos:', e);
          }
        }
        cookieStore.delete('anon_user_id');
      }

      return true;
    }
  }
})
