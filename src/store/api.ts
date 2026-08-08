import { UserProfile, ActivityLog } from './types';
import type { TeamSummary, PostWithAuthor, CommentWithAuthor, UnifiedFeedItem, PatientRadarData } from '@/types/teamTypes';

/** Erro tipado para respostas HTTP não-ok da API. Permite detectar status 403 nos componentes. */
export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function fetchApiOrThrow(url: string, options: RequestInit, errorMsg: string): Promise<Response> {
  const res = await fetch(url, options);
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: 'Erro desconhecido' }));
    throw new ApiError(res.status, body?.error ?? errorMsg);
  }
  return res;
}

export const fetchUserProfile = async (): Promise<UserProfile | null> => {
  try {
    const res = await fetch('/api/users/profile');
    if (!res.ok) return null;
    const data = await res.json();
    
    if (data.profile) {
      if (!data.profile.targets) {
        data.profile.targets = {
          water_ml_per_day: 2000,
          planned_meals: ['breakfast', 'lunch', 'afternoon_snack', 'dinner'],
          sleep_hours_per_night: 8,
          weekly_workouts: 3,
        };
      }
      if (!data.profile.profile) {
        data.profile.profile = {
          weight_kg: 70,
          height_cm: 170,
          gender: 'other',
          main_goal: 'health',
        };
      }
      if (!data.profile.notification_preferences) {
        data.profile.notification_preferences = {};
      }
    }
    
    return data.profile || null;
  } catch (error) {
    console.error('Falha ao buscar perfil', error);
    return null;
  }
};


/**
 * Salva o perfil do usuário no servidor (Mock)
 */
export const saveUserProfile = async (profile: UserProfile): Promise<void> => {
  const res = await fetch('/api/users/profile', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(profile),
  });
  if (!res.ok) {
    console.error('Falha ao salvar perfil', await res.text());
  }
};

/**
 * Busca o histórico de atividades do servidor (Mock)
 */
export const fetchActivityLogs = async (): Promise<ActivityLog[]> => {
  try {
    const res = await fetch('/api/logs');
    if (!res.ok) return [];
    const data = await res.json();
    return data.logs || [];
  } catch (error) {
    console.error('Falha ao buscar logs', error);
    return [];
  }
};

/**
 * Salva um novo registro de atividade no servidor (Mock)
 */
export const saveActivityLog = async (fullLog: ActivityLog): Promise<void> => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id, created_at, ...log } = fullLog;
  await fetchApiOrThrow('/api/logs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(log),
  }, 'Erro ao salvar log');
};

/**
 * Atualiza um registro de atividade no servidor
 */
export const updateActivityLog = async (id: string, fullLog: ActivityLog): Promise<void> => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id: _id, created_at, ...log } = fullLog;
  await fetchApiOrThrow(`/api/logs/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(log),
  }, 'Erro ao atualizar log');
};

/**
 * Remove um registro de atividade no servidor
 */
export const deleteActivityLog = async (id: string): Promise<void> => {
  await fetchApiOrThrow(`/api/logs/${id}`, { method: 'DELETE' }, 'Erro ao apagar log');
};

// ── Teams API (UI Mocks for now) ──────────────────────────

export const fetchMyTeams = async (): Promise<TeamSummary[]> => {
  const res = await fetch('/api/teams');
  if (!res.ok) {
    console.warn('Falha ao buscar teams, usando mock');
    return []; // Return empty array if backend not implemented
  }
  const data = await res.json();
  return data.teams || [];
};

export const createTeam = async (data: { name: string; description?: string }): Promise<TeamSummary> => {
  const res = await fetchApiOrThrow('/api/teams', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }, 'Erro ao criar team');
  return res.json();
};

export const fetchTeamDetails = async (teamId: string): Promise<TeamSummary | null> => {
  const res = await fetch(`/api/teams/${teamId}`);
  if (!res.ok) {
    console.warn('Falha ao buscar detalhes do team');
    return null;
  }
  const data = await res.json();
  return data.team || null;
};

export const updateTeamDetails = async (teamId: string, data: { name?: string; description?: string }): Promise<TeamSummary> => {
  const res = await fetchApiOrThrow(`/api/teams/${teamId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }, 'Erro ao atualizar team');
  const responseData = await res.json();
  return responseData.team;
};

export const deleteTeamAction = async (teamId: string): Promise<void> => {
  await fetchApiOrThrow(`/api/teams/${teamId}`, { method: 'DELETE' }, 'Erro ao apagar team');
};

export const joinTeamByCode = async (inviteCode: string): Promise<TeamSummary> => {
  const res = await fetchApiOrThrow('/api/teams/join', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ inviteCode }),
  }, 'Código inválido ou expirado');
  return res.json();
};

export const fetchTeamFeed = async (teamId: string): Promise<PostWithAuthor[]> => {
  const res = await fetch(`/api/teams/${teamId}/posts`);
  if (!res.ok) {
    console.warn('Falha ao buscar feed do team, usando mock vazio');
    return [];
  }
  const data = await res.json();
  return data.posts || [];
};

export const createPost = async (teamId: string, data: { content?: string; imageUrl?: string }): Promise<PostWithAuthor> => {
  const res = await fetchApiOrThrow(`/api/teams/${teamId}/posts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }, 'Erro ao publicar');
  return res.json();
};

export const toggleReaction = async (postId: string, emoji: string): Promise<void> => {
  await fetchApiOrThrow(`/api/posts/${postId}/reactions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ emoji }),
  }, 'Erro ao reagir');
};

// ── Nutri Dashboard API ──────────────────────────────────────

export const fetchNutriFeed = async (types?: string[]): Promise<UnifiedFeedItem[]> => {
  const params = types ? `?types=${types.join(',')}` : '';
  const res = await fetch(`/api/dashboard/feed${params}`);
  if (!res.ok) return [];
  const data = await res.json();
  return data.items || [];
};

export const fetchPatientRadar = async (): Promise<PatientRadarData> => {
  const res = await fetch('/api/dashboard/radar');
  if (!res.ok) return { atRisk: [], doingGreat: [] };
  const data = await res.json();
  return data.radar || { atRisk: [], doingGreat: [] };
};

export const fetchPostComments = async (postId: string): Promise<CommentWithAuthor[]> => {
  const res = await fetch(`/api/posts/${postId}/comments`);
  if (!res.ok) return [];
  const data = await res.json();
  return data.comments || [];
};

export const createPostComment = async (postId: string, text: string): Promise<CommentWithAuthor> => {
  const res = await fetchApiOrThrow(`/api/posts/${postId}/comments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  }, 'Erro ao comentar');
  return res.json();
};

export const sendNutriMessage = async (patientId: string, message: string): Promise<void> => {
  await fetchApiOrThrow('/api/dashboard/message', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ patientId, message }),
  }, 'Erro ao enviar mensagem');
};

export const fetchAiSuggestion = async (
  patientId: string,
  tone: 'encouragement' | 'congratulations' | 'concern' | 'general',
): Promise<string> => {
  const res = await fetchApiOrThrow('/api/dashboard/message/suggest', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ patientId, tone }),
  }, 'Erro ao gerar sugestao');
  const data = await res.json();
  return data.suggestion;
};
