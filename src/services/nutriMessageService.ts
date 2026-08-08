import { prisma } from '@/lib/prisma';
import { dispatchNotification } from './notificationService';
import { getPatientContext } from './patientContextService';
import { aiService } from './aiService';

/**
 * Sends a message from a nutritionist to a patient via the Notification system.
 * Verifies that the nutri is ADMIN in a team shared with the patient.
 */
export async function sendNutriMessage(
  nutriUserId: string,
  patientId: string,
  message: string,
): Promise<void> {
  // Verify shared team
  const sharedTeam = await findSharedTeam(nutriUserId, patientId);
  if (!sharedTeam) {
    throw new Error('Voce nao tem acesso a este paciente.');
  }

  const nutri = await prisma.user.findUnique({
    where: { id: nutriUserId },
    select: { name: true },
  });
  const nutriName = nutri?.name ?? 'Sua nutri';

  await dispatchNotification(
    patientId,
    'NUTRI_MESSAGE',
    `${nutriName} enviou uma mensagem`,
    message,
    { actionType: 'OPEN_NUTRI_MESSAGE' },
  );
}

/**
 * Generates an AI-suggested message for the nutri to send to a patient.
 * The nutri can edit the suggestion before sending.
 */
export async function generateAiMessageSuggestion(
  nutriUserId: string,
  patientId: string,
  tone: 'encouragement' | 'congratulations' | 'concern' | 'general',
): Promise<string> {
  const sharedTeam = await findSharedTeam(nutriUserId, patientId);
  if (!sharedTeam) {
    throw new Error('Voce nao tem acesso a este paciente.');
  }

  const ctx = await getPatientContext(patientId);

  const patient = await prisma.user.findUnique({
    where: { id: patientId },
    select: { name: true },
  });
  const patientName = patient?.name ?? 'paciente';

  const toneLabels: Record<string, string> = {
    encouragement: 'encorajamento e motivacao',
    congratulations: 'parabenizacao e celebracao',
    concern: 'preocupacao gentil e acolhedora',
    general: 'neutro e amigavel',
  };

  const todaySummary = ctx.todayLogs.length === 0
    ? 'Nenhum registro hoje.'
    : ctx.todayLogs.map((l) => `- ${l.category}: score ${l.primaryValue}/100`).join('\n');

  const prompt = `
Voce e uma nutricionista escrevendo uma mensagem curta e pessoal para ${patientName}.
Tom desejado: ${toneLabels[tone]}.

Contexto do paciente:
- Agua hoje: ${ctx.waterMlToday}ml de ${ctx.waterGoalMl}ml
- Refeicoes hoje: ${ctx.mealsToday} de ${ctx.mealsGoalPerDay}
- Treinos na semana: ${ctx.workoutsThisWeek} de ${ctx.workoutGoalPerWeek}
- Ultimo sono: ${ctx.lastSleepScore !== null ? `${ctx.lastSleepScore}/100` : 'nao registrado'}
- Dias desde ultimo treino: ${ctx.daysSinceLastWorkout ?? 'nunca registrou'}
- Sequencia de dias bons: ${ctx.currentStreak}
- Logs de hoje:
${todaySummary}

Regras:
- Maximo 2 frases.
- Use o nome do paciente.
- Seja empatica, nunca punitiva.
- Nao use markdown.
- Responda SOMENTE com o texto da mensagem, sem aspas.
`.trim();

  return aiService.generateRawText(prompt);
}

// ─── Internal Helper ────────────────────────────────────────────────────────

async function findSharedTeam(
  nutriUserId: string,
  patientId: string,
): Promise<{ teamId: string } | null> {
  // Find teams where nutriUserId is ADMIN
  const nutriTeams = await prisma.teamMember.findMany({
    where: { userId: nutriUserId, role: 'ADMIN' },
    select: { teamId: true },
  });
  const nutriTeamIds = nutriTeams.map((t) => t.teamId);

  if (nutriTeamIds.length === 0) return null;

  // Check if patient is a member of any of those teams
  const patientMembership = await prisma.teamMember.findFirst({
    where: {
      userId: patientId,
      teamId: { in: nutriTeamIds },
    },
    select: { teamId: true },
  });

  return patientMembership;
}
