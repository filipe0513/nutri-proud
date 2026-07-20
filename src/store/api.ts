import { UserProfile, ActivityLog } from './types';

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
export const saveActivityLog = async (log: ActivityLog): Promise<void> => {
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
export const updateActivityLog = async (id: string, log: ActivityLog): Promise<void> => {
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

