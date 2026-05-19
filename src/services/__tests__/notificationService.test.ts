/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { triggerWaterReminders, triggerJacadaRecovery, getUserNotifications, markAsRead } from '../notificationService';
import { prismaMock } from '@/lib/__mocks__/prisma';

vi.mock('@/lib/prisma', async () => {
  const { prismaMock } = await import('@/lib/__mocks__/prisma');
  return { prisma: prismaMock };
});

describe('notificationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch user notifications', async () => {
    const mockNotifications = [
      { id: '1', userId: 'user1', title: 'Test', message: 'Test message', isRead: false, category: 'REMINDER', actionType: null, createdAt: new Date() }
    ];
    prismaMock.notification.findMany.mockResolvedValue(mockNotifications as any);

    const result = await getUserNotifications('user1');
    expect(result).toEqual(mockNotifications);
    expect(prismaMock.notification.findMany).toHaveBeenCalledWith({
      where: { userId: 'user1' },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  });

  it('should mark notification as read', async () => {
    const mockUpdated = { id: '1', isRead: true };
    prismaMock.notification.update.mockResolvedValue(mockUpdated as any);

    const result = await markAsRead('1', 'user1');
    expect(result).toEqual(mockUpdated);
    expect(prismaMock.notification.update).toHaveBeenCalledWith({
      where: { id: '1', userId: 'user1' },
      data: { isRead: true },
    });
  });

  it('should trigger water reminders within time window', async () => {
    // Mock hour to be 20 (Brazil time)
    vi.useFakeTimers();
    const date = new Date();
    date.setUTCHours(23); // 23 - 3 = 20 local Brazil time
    vi.setSystemTime(date);

    prismaMock.user.findMany.mockResolvedValue([{ id: 'user1' }] as any);
    prismaMock.notification.create.mockResolvedValue({ id: 'new_id' } as any);

    const result = await triggerWaterReminders();
    expect(result.success).toBe(true);
    expect(result.count).toBe(1);
    expect(prismaMock.notification.create).toHaveBeenCalled();

    vi.useRealTimers();
  });

  it('should not trigger water reminders outside time window', async () => {
    // Mock hour to be 15 (Brazil time)
    vi.useFakeTimers();
    const date = new Date();
    date.setUTCHours(18); // 18 - 3 = 15 local Brazil time
    vi.setSystemTime(date);

    const result = await triggerWaterReminders();
    expect(result.success).toBe(true);
    expect(result.message).toBe('Not in time window for water reminders');
    expect(prismaMock.user.findMany).not.toHaveBeenCalled();

    vi.useRealTimers();
  });

  it('should trigger jacada recovery', async () => {
    prismaMock.user.findMany.mockResolvedValue([{ id: 'user1' }] as any);
    prismaMock.notification.findFirst.mockResolvedValue(null as any);
    prismaMock.notification.create.mockResolvedValue({ id: 'new_id' } as any);

    const result = await triggerJacadaRecovery();
    expect(result.success).toBe(true);
    expect(result.count).toBe(1);
    expect(prismaMock.notification.create).toHaveBeenCalled();
  });
});
