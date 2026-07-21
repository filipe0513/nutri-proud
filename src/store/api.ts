import { UserProfile, ActivityLog } from './types';
import type { SquadSummary, PostWithAuthor } from '@/types/squadTypes';

/** Erro tipado para respostas HTTP não-ok da API. Permite detectar status 403 nos componentes. */
export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
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
  const res = await fetch('/api/logs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(log),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: 'Erro desconhecido' }));
    throw new ApiError(res.status, body?.error ?? 'Erro ao salvar log');
  }
};

/**
 * Atualiza um registro de atividade no servidor
 */
export const updateActivityLog = async (id: string, fullLog: ActivityLog): Promise<void> => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id: _id, created_at, ...log } = fullLog;
  const res = await fetch(`/api/logs/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(log),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: 'Erro desconhecido' }));
    throw new ApiError(res.status, body?.error ?? 'Erro ao atualizar log');
  }
};

/**
 * Remove um registro de atividade no servidor
 */
export const deleteActivityLog = async (id: string): Promise<void> => {
  const res = await fetch(`/api/logs/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: 'Erro desconhecido' }));
    throw new ApiError(res.status, body?.error ?? 'Erro ao apagar log');
  }
};

// ── Squads API (UI Mocks for now) ──────────────────────────

export const fetchMySquads = async (): Promise<SquadSummary[]> => {
  const res = await fetch('/api/squads');
  if (!res.ok) {
    console.warn('Falha ao buscar squads, usando mock');
    return []; // Return empty array if backend not implemented
  }
  const data = await res.json();
  return data.squads || [];
};

export const createSquad = async (data: { name: string; description?: string }): Promise<SquadSummary> => {
  const res = await fetch('/api/squads', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: 'Erro desconhecido' }));
    throw new ApiError(res.status, body?.error ?? 'Erro ao criar squad');
  }
  return res.json();
};

export const joinSquadByCode = async (inviteCode: string): Promise<SquadSummary> => {
  const res = await fetch('/api/squads/join', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ inviteCode }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: 'Erro desconhecido' }));
    throw new ApiError(res.status, body?.error ?? 'Código inválido ou expirado');
  }
  return res.json();
};

export const fetchSquadFeed = async (squadId: string): Promise<PostWithAuthor[]> => {
  const res = await fetch(`/api/squads/${squadId}/posts`);
  if (!res.ok) {
    console.warn('Falha ao buscar feed do squad, usando mock vazio');
    return [];
  }
  const data = await res.json();
  return data.posts || [];
};

export const createPost = async (squadId: string, data: { content?: string; imageUrl?: string }): Promise<PostWithAuthor> => {
  const res = await fetch(`/api/squads/${squadId}/posts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: 'Erro desconhecido' }));
    throw new ApiError(res.status, body?.error ?? 'Erro ao publicar');
  }
  return res.json();
};

export const toggleReaction = async (postId: string, emoji: string): Promise<void> => {
  const res = await fetch(`/api/posts/${postId}/reactions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ emoji }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: 'Erro desconhecido' }));
    throw new ApiError(res.status, body?.error ?? 'Erro ao reagir');
  }
};
