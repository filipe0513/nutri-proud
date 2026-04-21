import { UserProfile, ActivityLog } from './types';

// Função utilitária para simular latência de rede
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Salva o perfil do usuário no servidor (Mock)
 */
export const saveUserProfile = async (profile: UserProfile): Promise<void> => {
  await delay(800); // Simulando requisição
  console.log('[API] saveUserProfile chamado com:', profile);
  // Futuramente: await axios.post('/api/users/profile', profile);
};

/**
 * Busca o histórico de atividades do servidor (Mock)
 */
export const fetchActivityLogs = async (): Promise<ActivityLog[]> => {
  await delay(500);
  console.log('[API] fetchActivityLogs chamado');
  // Futuramente: const { data } = await axios.get('/api/logs');
  return []; // O Zustand persist está lidando com o armazenamento local no MVP
};

/**
 * Salva um novo registro de atividade no servidor (Mock)
 */
export const saveActivityLog = async (log: ActivityLog): Promise<void> => {
  await delay(300);
  console.log('[API] saveActivityLog chamado com:', log);
  // Futuramente: await axios.post('/api/logs', log);
};
