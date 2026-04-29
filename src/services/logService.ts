import { prisma } from '@/lib/prisma';
import { userService } from './userService';

/**
 * Converts a date string to a safe DateTime for the DB.
 * If the string is YYYY-MM-DD (date-only) it sets the time to 12:00 UTC
 * to avoid timezone shifts that could move the date to the previous/next day.
 */
function toSafeEventTime(dateInput: string | undefined): Date {
  if (!dateInput) return new Date();

  // ISO datetime (has 'T') → parse as-is
  if (dateInput.includes('T')) return new Date(dateInput);

  // Date-only string → pin to 12:00 UTC
  return new Date(`${dateInput}T12:00:00.000Z`);
}

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
        eventTime: toSafeEventTime(logData.event_time),
      }
    });

    return newLog;
  }
};

