/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { triggerService } from '../triggerService';
import { prismaMock } from '@/lib/__mocks__/prisma';
import { FeedPostType } from '@prisma/client';

vi.mock('@/lib/prisma', async () => {
  const { prismaMock } = await import('@/lib/__mocks__/prisma');
  return { prisma: prismaMock };
});

vi.mock('../notificationService', () => ({
  notifyTeamAdmins: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../logService', () => ({
  getLocalDayInterval: vi.fn().mockReturnValue({
    start: new Date('2026-08-10T03:00:00.000Z'),
    end: new Date('2026-08-11T02:59:59.999Z'),
  }),
}));

import { notifyTeamAdmins } from '../notificationService';
import { getLocalDayInterval } from '../logService';

const mockNotifyTeamAdmins = vi.mocked(notifyTeamAdmins);
const mockGetLocalDayInterval = vi.mocked(getLocalDayInterval);

function makeLog(overrides: Partial<{
  id: string;
  userId: string;
  category: string;
  primaryValue: number;
  eventTime: Date;
  createdAt: Date;
  details: any;
}> = {}) {
  return {
    id: 'log-1',
    userId: 'patient-1',
    category: 'water',
    primaryValue: 50,
    eventTime: new Date('2026-08-10T12:00:00Z'),
    createdAt: new Date('2026-08-10T12:00:00Z'),
    details: {} as any,
    source: 'UNKNOWN',
    ...overrides,
  };
}

const PATIENT_ID = 'patient-1';
const TEAM_ID = 'team-1';

beforeEach(() => {
  vi.resetAllMocks();
  // restore implementations cleared by resetAllMocks so .catch() chains in the service don't throw
  mockNotifyTeamAdmins.mockResolvedValue(undefined);
  mockGetLocalDayInterval.mockReturnValue({
    start: new Date('2026-08-10T03:00:00.000Z'),
    end: new Date('2026-08-11T02:59:59.999Z'),
  });
});

describe('triggerService.evaluatePatientTriggers', () => {
  describe('Resurrection alert', () => {
    it('creates TeamFeedPost and notifies admins when gap is 3+ days', async () => {
      const latestLog = makeLog({ createdAt: new Date('2026-08-10T12:00:00Z') });
      const previousLog = makeLog({ createdAt: new Date('2026-08-06T12:00:00Z') }); // 4 days ago

      prismaMock.user.findUnique.mockResolvedValueOnce({ name: 'Ana Silva' } as any);
      prismaMock.dailyLog.findFirst.mockResolvedValueOnce(previousLog as any);
      prismaMock.teamFeedPost.findFirst.mockResolvedValueOnce(null); // no existing resurrection
      prismaMock.teamFeedPost.create.mockResolvedValueOnce({ id: 'feed-1' } as any);

      // Perfect day check also needs these
      prismaMock.dailyLog.findMany.mockResolvedValueOnce([]); // today's logs
      prismaMock.user.findUnique.mockResolvedValueOnce({ targets: null } as any);
      prismaMock.teamFeedPost.findFirst.mockResolvedValueOnce({ id: 'existing' } as any); // dedup perfect day

      await triggerService.evaluatePatientTriggers(PATIENT_ID, TEAM_ID, latestLog as any);

      expect(prismaMock.teamFeedPost.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            teamId: TEAM_ID,
            patientId: PATIENT_ID,
            type: FeedPostType.MILESTONE,
            content: expect.stringContaining('Retomou os registros após 4 dias'),
          }),
        })
      );
      expect(mockNotifyTeamAdmins).toHaveBeenCalledWith(
        TEAM_ID,
        PATIENT_ID,
        'TEAM_ALERT',
        expect.stringContaining('Alerta'),
        expect.stringContaining('Retomou os registros'),
        expect.any(Object)
      );
    });

    it('does NOT trigger when gap is less than 3 days', async () => {
      const latestLog = makeLog({ createdAt: new Date('2026-08-10T12:00:00Z') });
      const previousLog = makeLog({ createdAt: new Date('2026-08-09T12:00:00Z') }); // 1 day ago

      prismaMock.user.findUnique.mockResolvedValueOnce({ name: 'Ana Silva' } as any);
      prismaMock.dailyLog.findFirst.mockResolvedValueOnce(previousLog as any);

      // Perfect day check
      prismaMock.dailyLog.findMany.mockResolvedValueOnce([]);
      prismaMock.user.findUnique.mockResolvedValueOnce({ targets: null } as any);
      prismaMock.teamFeedPost.findFirst.mockResolvedValueOnce({ id: 'existing' } as any);

      await triggerService.evaluatePatientTriggers(PATIENT_ID, TEAM_ID, latestLog as any);

      // No resurrection post should be created (no findFirst for resurrection check)
      expect(prismaMock.teamFeedPost.create).not.toHaveBeenCalled();
    });
  });

  describe('Red flag poop', () => {
    it('creates ALERT post when last 3 poop logs all have score <= 25', async () => {
      const latestLog = makeLog({ category: 'poop', primaryValue: 20 });
      const poopLogs = [
        makeLog({ category: 'poop', primaryValue: 20 }),
        makeLog({ category: 'poop', primaryValue: 15, eventTime: new Date('2026-08-09T12:00:00Z') }),
        makeLog({ category: 'poop', primaryValue: 10, eventTime: new Date('2026-08-08T12:00:00Z') }),
      ];

      prismaMock.user.findUnique.mockResolvedValueOnce({ name: 'Ana Silva' } as any);
      prismaMock.dailyLog.findFirst.mockResolvedValueOnce(null); // no previous log
      // poop check
      prismaMock.dailyLog.findMany.mockResolvedValueOnce(poopLogs as any);
      prismaMock.teamFeedPost.findFirst.mockResolvedValueOnce(null); // no existing alert
      prismaMock.teamFeedPost.create.mockResolvedValueOnce({ id: 'feed-2' } as any);
      // perfect day check
      prismaMock.dailyLog.findMany.mockResolvedValueOnce([]);
      prismaMock.user.findUnique.mockResolvedValueOnce({ targets: null } as any);
      prismaMock.teamFeedPost.findFirst.mockResolvedValueOnce({ id: 'existing' } as any);

      await triggerService.evaluatePatientTriggers(PATIENT_ID, TEAM_ID, latestLog as any);

      expect(prismaMock.teamFeedPost.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            type: FeedPostType.ALERT,
            content: expect.stringContaining('constipação'),
          }),
        })
      );
    });

    it('does NOT trigger when not all 3 poop logs are <= 25', async () => {
      const latestLog = makeLog({ category: 'poop', primaryValue: 60 });
      const poopLogs = [
        makeLog({ category: 'poop', primaryValue: 60 }),
        makeLog({ category: 'poop', primaryValue: 20 }),
        makeLog({ category: 'poop', primaryValue: 15 }),
      ];

      prismaMock.user.findUnique.mockResolvedValueOnce({ name: 'Ana Silva' } as any);
      prismaMock.dailyLog.findFirst.mockResolvedValueOnce(null);
      prismaMock.dailyLog.findMany.mockResolvedValueOnce(poopLogs as any);
      // perfect day check
      prismaMock.dailyLog.findMany.mockResolvedValueOnce([]);
      prismaMock.user.findUnique.mockResolvedValueOnce({ targets: null } as any);
      prismaMock.teamFeedPost.findFirst.mockResolvedValueOnce({ id: 'existing' } as any);

      await triggerService.evaluatePatientTriggers(PATIENT_ID, TEAM_ID, latestLog as any);

      expect(prismaMock.teamFeedPost.create).not.toHaveBeenCalled();
    });
  });

  describe('Perfect day', () => {
    it('creates MILESTONE post when daily average across pillars >= 80', async () => {
      const latestLog = makeLog({ category: 'water' });

      prismaMock.user.findUnique.mockResolvedValueOnce({ name: 'Ana Silva' } as any);
      prismaMock.dailyLog.findFirst.mockResolvedValueOnce(null);

      // Today's logs — water 2000ml (100%), food 3 meals, workout 90, sleep 85, poop 80
      const todaysLogs = [
        makeLog({ category: 'water', primaryValue: 0, details: { quantity_ml: 2000 } }),
        makeLog({ category: 'food', primaryValue: 80 }),
        makeLog({ category: 'food', primaryValue: 90 }),
        makeLog({ category: 'food', primaryValue: 85 }),
        makeLog({ category: 'workout', primaryValue: 90 }),
        makeLog({ category: 'sleep', primaryValue: 85 }),
        makeLog({ category: 'poop', primaryValue: 80 }),
      ];

      prismaMock.dailyLog.findMany.mockResolvedValueOnce(todaysLogs as any);
      prismaMock.user.findUnique.mockResolvedValueOnce({
        targets: { water_ml_per_day: 2000, planned_meals: ['B', 'L', 'D'] },
      } as any);
      prismaMock.teamFeedPost.findFirst.mockResolvedValueOnce(null); // no existing perfect day
      prismaMock.teamFeedPost.create.mockResolvedValueOnce({ id: 'feed-3' } as any);

      await triggerService.evaluatePatientTriggers(PATIENT_ID, TEAM_ID, latestLog as any);

      expect(prismaMock.teamFeedPost.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            type: FeedPostType.MILESTONE,
            content: expect.stringContaining('excelência total'),
          }),
        })
      );
    });
  });

  describe('Deduplication', () => {
    it('does NOT re-fire resurrection alert if one already exists today', async () => {
      const latestLog = makeLog({ createdAt: new Date('2026-08-10T12:00:00Z') });
      const previousLog = makeLog({ createdAt: new Date('2026-08-06T12:00:00Z') }); // 4 days ago

      prismaMock.user.findUnique.mockResolvedValueOnce({ name: 'Ana Silva' } as any);
      prismaMock.dailyLog.findFirst.mockResolvedValueOnce(previousLog as any);
      prismaMock.teamFeedPost.findFirst.mockResolvedValueOnce({ id: 'existing-resurrection' } as any); // already exists

      // perfect day check
      prismaMock.dailyLog.findMany.mockResolvedValueOnce([]);
      prismaMock.user.findUnique.mockResolvedValueOnce({ targets: null } as any);
      prismaMock.teamFeedPost.findFirst.mockResolvedValueOnce({ id: 'existing-perfect' } as any);

      await triggerService.evaluatePatientTriggers(PATIENT_ID, TEAM_ID, latestLog as any);

      expect(prismaMock.teamFeedPost.create).not.toHaveBeenCalled();
      expect(mockNotifyTeamAdmins).not.toHaveBeenCalled();
    });

    it('does NOT re-fire red flag poop alert if one already exists in window', async () => {
      const latestLog = makeLog({ category: 'poop', primaryValue: 20 });
      const poopLogs = [
        makeLog({ category: 'poop', primaryValue: 20 }),
        makeLog({ category: 'poop', primaryValue: 15 }),
        makeLog({ category: 'poop', primaryValue: 10 }),
      ];

      prismaMock.user.findUnique.mockResolvedValueOnce({ name: 'Ana Silva' } as any);
      prismaMock.dailyLog.findFirst.mockResolvedValueOnce(null);
      prismaMock.dailyLog.findMany.mockResolvedValueOnce(poopLogs as any);
      prismaMock.teamFeedPost.findFirst.mockResolvedValueOnce({ id: 'existing-alert' } as any); // already exists

      // perfect day check
      prismaMock.dailyLog.findMany.mockResolvedValueOnce([]);
      prismaMock.user.findUnique.mockResolvedValueOnce({ targets: null } as any);
      prismaMock.teamFeedPost.findFirst.mockResolvedValueOnce({ id: 'existing-perfect' } as any);

      await triggerService.evaluatePatientTriggers(PATIENT_ID, TEAM_ID, latestLog as any);

      expect(prismaMock.teamFeedPost.create).not.toHaveBeenCalled();
      expect(mockNotifyTeamAdmins).not.toHaveBeenCalled();
    });
  });

  describe('No trigger (happy path)', () => {
    it('does nothing when no conditions are met', async () => {
      const latestLog = makeLog({ category: 'water' });
      const previousLog = makeLog({ createdAt: new Date('2026-08-09T12:00:00Z') }); // only 1 day gap

      prismaMock.user.findUnique.mockResolvedValueOnce({ name: 'Ana Silva' } as any);
      prismaMock.dailyLog.findFirst.mockResolvedValueOnce(previousLog as any);

      // perfect day check — score < 80
      prismaMock.dailyLog.findMany.mockResolvedValueOnce([
        makeLog({ category: 'workout', primaryValue: 30 }),
      ] as any);
      prismaMock.user.findUnique.mockResolvedValueOnce({ targets: null } as any);
      prismaMock.teamFeedPost.findFirst.mockResolvedValueOnce({ id: 'existing' } as any);

      await triggerService.evaluatePatientTriggers(PATIENT_ID, TEAM_ID, latestLog as any);

      expect(prismaMock.teamFeedPost.create).not.toHaveBeenCalled();
      expect(mockNotifyTeamAdmins).not.toHaveBeenCalled();
    });
  });
});
