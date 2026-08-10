import { prisma } from '@/lib/prisma';
import { DailyLog, FeedPostType } from '@prisma/client';
import { getLocalDayInterval } from './logService';
import { calculateWaterScore, calculateFoodScore } from '@/utils/scoreUtils';
import { notifyTeamAdmins } from './notificationService';

export const triggerService = {
  async evaluatePatientTriggers(patientId: string, teamId: string, latestLog: DailyLog) {
    try {
      const patient = await prisma.user.findUnique({
        where: { id: patientId },
        select: { name: true },
      });
      const patientName = patient?.name ?? 'Paciente';

      // 1. Check Ressurreição (Resurrection)
      const previousLog = await prisma.dailyLog.findFirst({
        where: {
          userId: patientId,
          createdAt: { lt: latestLog.createdAt },
        },
        orderBy: { createdAt: 'desc' },
      });

      if (previousLog) {
        const diffTime = latestLog.createdAt.getTime() - previousLog.createdAt.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays >= 3) {
          // Verify if we already created a milestone for resurrection today
          const startOfDayUTC = new Date();
          startOfDayUTC.setUTCHours(0, 0, 0, 0);

          const existingResurrection = await prisma.teamFeedPost.findFirst({
            where: {
              patientId,
              teamId,
              type: FeedPostType.MILESTONE,
              content: { contains: 'Retomou os registros' },
              createdAt: { gte: startOfDayUTC },
            },
          });

          if (!existingResurrection) {
            const content = `Retomou os registros após ${diffDays} dias inativo.`;
            await prisma.teamFeedPost.create({
              data: {
                teamId,
                patientId,
                type: FeedPostType.MILESTONE,
                content,
              },
            });
            notifyTeamAdmins(teamId, patientId, 'TEAM_ALERT', `Alerta: ${patientName}`, content, { actionType: 'OPEN_DASHBOARD_FEED' }).catch(() => {});
          }
        }
      }

      // 2. Check Evolução
      if (latestLog.category === 'evolution') {
        const content = 'Novo Check-in registrado.';
        await prisma.teamFeedPost.create({
          data: {
            teamId,
            patientId,
            type: FeedPostType.EVOLUTION,
            content,
          },
        });
        notifyTeamAdmins(teamId, patientId, 'TEAM_ALERT', `Alerta: ${patientName}`, content, { actionType: 'OPEN_DASHBOARD_FEED' }).catch(() => {});
      }

      // 3. Check Red Flag (POOP)
      if (latestLog.category === 'poop') {
        const last3Poops = await prisma.dailyLog.findMany({
          where: { userId: patientId, category: 'poop' },
          orderBy: { eventTime: 'desc' },
          take: 3,
        });

        if (last3Poops.length === 3 && last3Poops.every((log) => log.primaryValue <= 25)) {
          // Check if already alerted recently (within 2 days)
          const twoDaysAgo = new Date();
          twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

          const existingAlert = await prisma.teamFeedPost.findFirst({
            where: {
              patientId,
              teamId,
              type: FeedPostType.ALERT,
              content: { contains: 'Atenção: Indicativo de constipação' },
              createdAt: { gte: twoDaysAgo },
            },
          });

          if (!existingAlert) {
            const content = 'Atenção: Indicativo de constipação (últimos 3 dias com intestino ruim).';
            await prisma.teamFeedPost.create({
              data: {
                teamId,
                patientId,
                type: FeedPostType.ALERT,
                content,
              },
            });
            notifyTeamAdmins(teamId, patientId, 'TEAM_ALERT', `Alerta: ${patientName}`, content, { actionType: 'OPEN_DASHBOARD_FEED' }).catch(() => {});
          }
        }
      }

      // 4. Check Perfect Day (Excelência do Dia)
      const eventTimeStr = latestLog.eventTime.toISOString();
      const { start, end } = getLocalDayInterval(eventTimeStr);

      const todaysLogs = await prisma.dailyLog.findMany({
        where: {
          userId: patientId,
          eventTime: { gte: start, lte: end },
        },
      });

      const user = await prisma.user.findUnique({
        where: { id: patientId },
        select: { targets: true },
      });

      const targets = (user?.targets as Record<string, unknown>) || {};
      const targetWater = (typeof targets.water_ml_per_day === 'number' ? targets.water_ml_per_day : 2000);
      const plannedMeals = Array.isArray(targets.planned_meals) ? targets.planned_meals.length : 3;

      let waterSum = 0;
      const foodLogs: DailyLog[] = [];
      let workoutSum = 0, workoutCount = 0;
      let sleepSum = 0, sleepCount = 0;
      let poopSum = 0, poopCount = 0;

      for (const log of todaysLogs) {
        if (log.category === 'water') {
          const details = log.details as Record<string, unknown>;
          waterSum += (typeof details?.quantity_ml === 'number' ? details.quantity_ml : 0);
        }
        else if (log.category === 'food') foodLogs.push(log);
        else if (log.category === 'workout') { workoutSum += log.primaryValue; workoutCount++; }
        else if (log.category === 'sleep') { sleepSum += log.primaryValue; sleepCount++; }
        else if (log.category === 'poop') { poopSum += log.primaryValue; poopCount++; }
      }

      const scoreWater = calculateWaterScore(waterSum, targetWater);
      const scoreFood = calculateFoodScore(foodLogs, plannedMeals > 0 ? plannedMeals : 3);
      const scoreWorkout = workoutCount > 0 ? Math.min(100, Math.round(workoutSum / workoutCount)) : 0;
      const scoreSleep = sleepCount > 0 ? Math.min(100, Math.round(sleepSum / sleepCount)) : 0;
      const scorePoop = poopCount > 0 ? Math.min(100, Math.round(poopSum / poopCount)) : 0;

      const dailyScore = (scoreWater + scoreFood + scoreWorkout + scoreSleep + scorePoop) / 5;

      if (dailyScore >= 80) {
        // Only one perfect day alert per day
        const existingPerfectDay = await prisma.teamFeedPost.findFirst({
          where: {
            patientId,
            teamId,
            type: FeedPostType.MILESTONE,
            content: { contains: 'Atingiu excelência total' },
            createdAt: { gte: start, lte: end },
          },
        });

        if (!existingPerfectDay) {
          const content = 'Atingiu excelência total hoje! 🎉';
          await prisma.teamFeedPost.create({
            data: {
              teamId,
              patientId,
              type: FeedPostType.MILESTONE,
              content,
              metadata: { dailyScore: Math.round(dailyScore) },
            },
          });
          notifyTeamAdmins(teamId, patientId, 'TEAM_ALERT', `Alerta: ${patientName}`, content, { actionType: 'OPEN_DASHBOARD_FEED' }).catch(() => {});
        }
      }
    } catch (error) {
      console.error('Error evaluating triggers:', error);
    }
  },
};
