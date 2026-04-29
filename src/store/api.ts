import { UserProfile, ActivityLog } from './types';

export const fetchUserProfile = async (): Promise<UserProfile | null> => {
  try {
    const res = await fetch('/api/users/profile');
    if (!res.ok) return null;
    const data = await res.json();
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
    console.error('Falha ao salvar log', await res.text());
  }
};
