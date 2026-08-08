/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prismaMock } from '@/lib/__mocks__/prisma';

vi.mock('@/lib/prisma', async () => {
  const { prismaMock } = await import('@/lib/__mocks__/prisma');
  return { prisma: prismaMock };
});

const mockDispatch = vi.fn().mockResolvedValue({ success: true });
vi.mock('@/services/notificationService', () => ({
  dispatchNotification: (...args: unknown[]) => mockDispatch(...args),
}));

vi.mock('@/services/patientContextService', () => ({
  getPatientContext: vi.fn().mockResolvedValue({
    waterMlToday: 500,
    waterGoalMl: 2500,
    mealsToday: 1,
    mealsGoalPerDay: 3,
    workoutsThisWeek: 2,
    workoutGoalPerWeek: 3,
    lastSleepScore: 75,
    daysSinceLastWorkout: 1,
    currentStreak: 3,
    todayLogs: [],
  }),
}));

vi.mock('@/services/aiService', () => ({
  aiService: {
    generateRawText: vi.fn().mockResolvedValue('Oi, Maria! Voce esta indo muito bem!'),
  },
}));

import { sendNutriMessage, generateAiMessageSuggestion } from '../nutriMessageService';

describe('nutriMessageService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('sendNutriMessage', () => {
    it('should dispatch notification to patient when nutri is ADMIN in shared team', async () => {
      // nutri is ADMIN in team t1
      prismaMock.teamMember.findMany.mockResolvedValue([{ teamId: 't1' }] as any);
      // patient is member of team t1
      prismaMock.teamMember.findFirst.mockResolvedValue({ teamId: 't1' } as any);
      // nutri name
      prismaMock.user.findUnique.mockResolvedValueOnce({ name: 'Dra. Ana' } as any);
      // dispatchNotification finds user
      prismaMock.user.findUnique.mockResolvedValueOnce({
        id: 'patient1',
        email: null,
        oneSignalId: null,
        notification_preferences: {},
      } as any);
      prismaMock.notification.create.mockResolvedValue({ id: 'n1' } as any);

      await sendNutriMessage('nutri1', 'patient1', 'Beba mais agua!');

      expect(mockDispatch).toHaveBeenCalledWith(
        'patient1',
        'NUTRI_MESSAGE',
        'Dra. Ana enviou uma mensagem',
        'Beba mais agua!',
        { actionType: 'OPEN_NUTRI_MESSAGE' },
      );
    });

    it('should throw if nutri has no shared team with patient', async () => {
      prismaMock.teamMember.findMany.mockResolvedValue([{ teamId: 't1' }] as any);
      prismaMock.teamMember.findFirst.mockResolvedValue(null as any);

      await expect(
        sendNutriMessage('nutri1', 'patient1', 'Hello'),
      ).rejects.toThrow('Voce nao tem acesso a este paciente.');
    });
  });

  describe('generateAiMessageSuggestion', () => {
    it('should generate a suggestion when nutri has access', async () => {
      prismaMock.teamMember.findMany.mockResolvedValue([{ teamId: 't1' }] as any);
      prismaMock.teamMember.findFirst.mockResolvedValue({ teamId: 't1' } as any);
      prismaMock.user.findUnique.mockResolvedValue({ name: 'Maria' } as any);

      const result = await generateAiMessageSuggestion('nutri1', 'patient1', 'encouragement');

      expect(result).toBe('Oi, Maria! Voce esta indo muito bem!');
    });

    it('should throw if no shared team', async () => {
      prismaMock.teamMember.findMany.mockResolvedValue([{ teamId: 't1' }] as any);
      prismaMock.teamMember.findFirst.mockResolvedValue(null as any);

      await expect(
        generateAiMessageSuggestion('nutri1', 'patient1', 'general'),
      ).rejects.toThrow('Voce nao tem acesso a este paciente.');
    });
  });
});
