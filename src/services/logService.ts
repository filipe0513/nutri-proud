import { prisma } from '@/lib/prisma';
import { userService } from './userService';

export const logService = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async saveLog(userId: string, logData: any) {
    // 1. Checa as permissões e limites (lançará PermissionError se bloqueado)
    await userService.checkUserPermissions(userId);

    // 2. Salva o registro
    const newLog = await prisma.dailyLog.create({
      data: {
        userId,
        category: logData.category,
        primaryValue: logData.primary_value,
        details: logData.details,
        eventTime: new Date(logData.event_time)
      }
    });

    return newLog;
  }
};
