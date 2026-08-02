"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { userService } from "@/services/userService";

export async function getAdminUserLogs(userId: string) {
  const session = await auth();

  // Verifica permissão Server-Side
  if (!session?.user || (session.user as { role?: string }).role !== "ADMIN") {
    throw new Error("Não autorizado");
  }

  // Busca os últimos 50 logs do usuário
  const logs = await prisma.dailyLog.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return logs;
}

export async function promoteUserToNutritionist(userId: string): Promise<{ teamInviteCode: string }> {
  const session = await auth();

  if (!session?.user || (session.user as { role?: string }).role !== "ADMIN") {
    throw new Error("Não autorizado");
  }

  return userService.promoteToNutritionist(userId);
}
