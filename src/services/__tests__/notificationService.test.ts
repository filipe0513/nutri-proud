/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { triggerWaterReminders, triggerJacadaRecovery, getUserNotifications, markAsRead, createInsightNotification, createJacadaNotification, dispatchNotification } from '../notificationService';
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

  // ─── New functions ───────────────────────────────────────────────────────────

  it('createInsightNotification should persist an INSIGHT notification with correct fields', async () => {
    // Arrange
    const mockCreated = { id: 'ins-1', category: 'INSIGHT', actionType: 'OPEN_INSIGHTS_DRAWER' };
    prismaMock.notification.create.mockResolvedValue(mockCreated as any);

    // Act
    await createInsightNotification('user1', 'Beba mais água hoje! 💧', 'WATER');

    // Assert
    expect(prismaMock.notification.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: 'user1',
          category: 'INSIGHT',
          actionType: 'OPEN_INSIGHTS_DRAWER',
          title: 'Nutri tem um insight para você ✨',
        }),
      })
    );
  });

  it('createJacadaNotification should persist a SYSTEM notification for the jacada reaction', async () => {
    // Arrange
    const mockCreated = { id: 'jac-1', category: 'SYSTEM' };
    prismaMock.notification.create.mockResolvedValue(mockCreated as any);

    // Act
    await createJacadaNotification('user2', 'Amanhã a garrafa d\'água será sua melhor amiga! 🍺');

    // Assert
    expect(prismaMock.notification.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: 'user2',
          category: 'SYSTEM',
          actionType: null,
          title: 'Nutri reagiu à sua jacada 🍔',
        }),
      })
    );
  });

  // ─── dispatchNotification ───────────────────────────────────────────────────

  describe('dispatchNotification', () => {
    it('should respect user preferences and dispatch to enabled channels', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: 'user1',
        email: 'test@test.com',
        oneSignalId: 'onesignal-123',
        notification_preferences: {
          REMINDER: { in_app: true, email: true, push: false },
        },
      } as any);

      prismaMock.notification.create.mockResolvedValue({ id: 'new_id' } as any);

      const result = await dispatchNotification('user1', 'REMINDER', 'Title', 'Body');
      
      expect(result.success).toBe(true);
      expect(result.dispatched).toEqual({ in_app: true, email: true, push: false });
      expect(prismaMock.notification.create).toHaveBeenCalled();
    });

    it('should fallback to default true if preference is missing', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: 'user1',
        email: 'test@test.com',
        oneSignalId: 'onesignal-123',
        notification_preferences: {},
      } as any);

      prismaMock.notification.create.mockResolvedValue({ id: 'new_id' } as any);

      const result = await dispatchNotification('user1', 'EVOLUTION', 'Title', 'Body');
      
      expect(result.success).toBe(true);
      expect(result.dispatched).toEqual({ in_app: true, email: true, push: true });
      expect(prismaMock.notification.create).toHaveBeenCalled();
    });

    it('should return error if user not found', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      const result = await dispatchNotification('invalid_user', 'SYSTEM', 'Title', 'Body');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('User not found');
      expect(prismaMock.notification.create).not.toHaveBeenCalled();
    });
  });
});
