/* eslint-disable @typescript-eslint/no-unused-vars */
import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { authConfig } from "./auth.config";
import { cookies } from "next/headers";
import Google from "next-auth/providers/google";
import Resend from "next-auth/providers/resend";

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    Resend({
      apiKey: process.env.RESEND_API_KEY,
      from: process.env.AUTH_RESEND_FROM ?? "Orgulho da Nutri <login@orgulhodanutri.com>",
      async sendVerificationRequest({ identifier: email, url, provider }) {
        const { host } = new URL(url);
        
        const htmlContent = `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <style>
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f4f5; margin: 0; padding: 40px 20px; }
                .container { max-width: 480px; margin: 0 auto; background: #ffffff; border-radius: 16px; padding: 32px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); text-align: center; }
                .logo { font-size: 22px; font-weight: bold; color: #10b981; margin-bottom: 24px; display: inline-block; }
                .title { font-size: 20px; color: #18181b; font-weight: 700; margin-bottom: 12px; }
                .text { font-size: 15px; color: #71717a; line-height: 1.5; margin-bottom: 28px; }
                .button { display: inline-block; background: #10b981; color: #ffffff !important; font-weight: 600; font-size: 16px; padding: 14px 28px; border-radius: 12px; text-decoration: none; margin-bottom: 24px; }
                .footer { font-size: 12px; color: #a1a1aa; margin-top: 24px; line-height: 1.4; }
                .link-fallback { font-size: 11px; color: #a1a1aa; word-break: break-all; margin-top: 16px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="logo">🍏 Orgulho da Nutri</div>
                <div class="title">Seu link de acesso chegou!</div>
                <div class="text">Clique no botão abaixo para entrar com segurança no seu aplicativo de hábitos.</div>
                <a href="${url}" class="button" target="_blank">Entrar no Orgulho da Nutri 🚀</a>
                <div class="text" style="font-size: 13px;">Este link é válido por tempo limitado. Se você não solicitou este e-mail, pode ignorá-lo com segurança.</div>
                <div class="footer">Orgulho da Nutri • Todos os direitos reservados.</div>
              </div>
            </body>
          </html>
        `;

        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${(provider as { apiKey?: string }).apiKey || process.env.RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: provider.from || 'Orgulho da Nutri <login@orgulhodanutri.com>',
            to: email,
            subject: 'Acesse sua conta no Orgulho da Nutri 🍏',
            html: htmlContent,
          }),
        });

        if (!res.ok) {
          throw new Error(`Resend error: ${JSON.stringify(await res.json())}`);
        }
      },
    }),
  ],
  adapter: PrismaAdapter(prisma),
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ user, account, profile }) {
      // Lógica de Upgrade (O "Merge")
      const cookieStore = await cookies();
      const anonUserId = cookieStore.get("anon_user_id")?.value;

      if (anonUserId) {
        const realUserId = user.id;
        console.log(
          `[Auth/Merge] Iniciando merge: anônimo=${anonUserId} → real=${realUserId}`,
        );

        if (realUserId && realUserId !== anonUserId) {
          try {
            const anonUser = await prisma.user.findUnique({
              where: { id: anonUserId, is_anonymous: true },
            });

            if (anonUser) {
              console.log(
                `[Auth/Merge] Usuário anônimo encontrado. Migrando logs...`,
              );

              // Garante que o usuário real já existe na DB antes de migrar os logs.
              // O Prisma Adapter pode ainda não ter persistido o registro neste ponto
              // do callback signIn (especialmente no primeiro login OAuth), o que
              // causaria uma FK violation em DailyLog_userId_fkey.
              const realUserExists = await prisma.user.findUnique({
                where: { id: realUserId },
              });

              if (!realUserExists) {
                console.log(
                  `[Auth/Merge] Usuário real ${realUserId} ainda não existe na DB. Criando registro mínimo para garantir FK...`,
                );
                await prisma.user.create({
                  data: {
                    id: realUserId,
                    email: user.email ?? null,
                    name: user.name ?? null,
                    image: user.image ?? null,
                    is_anonymous: false,
                  },
                });
              }

              const updated = await prisma.dailyLog.updateMany({
                where: { userId: anonUserId },
                data: { userId: realUserId },
              });
              console.log(
                `[Auth/Merge] ${updated.count} logs migrados com sucesso.`,
              );

              const realUserFromDb = await prisma.user.findUnique({
                where: { id: realUserId },
              });

              // Se o usuário real não tiver profile/targets (é uma conta nova), copiamos do anônimo
              const newProfile =
                realUserFromDb?.profile || anonUser.profile || undefined;
              const newTargets =
                realUserFromDb?.targets || anonUser.targets || undefined;
              const newName =
                realUserFromDb?.name || anonUser.name || undefined;

              await prisma.user.update({
                where: { id: realUserId },
                data: {
                  profile: newProfile ?? undefined,
                  targets: newTargets ?? undefined,
                  name: newName ?? undefined,
                },
              });
              console.log(
                `[Auth/Merge] Perfil e metas transferidos para o usuário real.`,
              );

              await prisma.user.delete({
                where: { id: anonUserId },
              });
              console.log(
                `[Auth/Merge] Usuário anônimo ${anonUserId} deletado.`,
              );
            } else {
              console.log(
                `[Auth/Merge] Nenhum usuário anônimo encontrado com id=${anonUserId}. Merge ignorado.`,
              );
            }
          } catch (e) {
            // Não bloqueia o login — apenas loga o erro.
            console.error("[Auth/Merge] Falha ao migrar dados anônimos:", e);
          }
        } else {
          console.log(
            `[Auth/Merge] realUserId ausente ou igual ao anonUserId. Merge ignorado.`,
          );
        }

        try {
          cookieStore.delete("anon_user_id");
          console.log(`[Auth/Merge] Cookie anon_user_id removido.`);
        } catch (cookieError) {
          console.error(
            "[Auth/Merge] Falha ao remover cookie anon_user_id (pode ser restrição do ambiente):",
            cookieError,
          );
        }
      }

      return true;
    },
  },
});
