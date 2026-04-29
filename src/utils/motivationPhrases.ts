export type StreakPhraseCategory = 'WORKOUT_WEEKLY_STREAK' | 'DAILY_STREAK' | 'SLUMP';

const CATEGORY_NAMES: Record<string, string> = {
  WATER: 'hidratação',
  FOOD: 'alimentação',
  SLEEP: 'sono',
  POOP: 'intestino',
};

const WORKOUT_WEEKLY_PHRASES = [
  'Incrível! Meta de treinos batida por {streak} semanas seguidas. 🏆',
  'Consistência é tudo! {streak} semanas no ritmo. Continue assim! 💪',
  'Você está dominando! {streak} semanas de meta atingida. Seu corpo agradece! 🔥',
  'Animal! {streak} semanas seguidas batendo a meta de treino. Lendário! 🏅',
];

const DAILY_STREAK_PHRASES = [
  'Fogo aceso! {streak} dias seguidos cuidando da sua {category}. 🔥',
  'Consistência em {category}! {streak} dias no caminho certo. 💧',
  'Você é imparável! {streak} dias cuidando da sua {category}. 🚀',
  '{streak} dias seguidos! Sua {category} está sendo prioridade. ✨',
];

const SLUMP_PHRASES = [
  'O fogo apagou... Que tal recomeçar hoje? 🌱',
  'Cada dia é um novo começo. Que tal dar um passo hoje? 💡',
  'Pequenas ações, grandes resultados. Comece agora! ⚡',
  'Recomeçar faz parte da jornada. Você consegue! 🙌',
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function getWorkoutStreakPhrase(streak: number): string {
  const template = pick(WORKOUT_WEEKLY_PHRASES);
  return template.replace('{streak}', String(streak));
}

export function getDailyStreakPhrase(streak: number, category: string): string {
  const template = pick(DAILY_STREAK_PHRASES);
  const categoryName = CATEGORY_NAMES[category.toUpperCase()] ?? category;
  return template
    .replace('{streak}', String(streak))
    .replace('{category}', categoryName);
}

export function getSlumpPhrase(): string {
  return pick(SLUMP_PHRASES);
}
