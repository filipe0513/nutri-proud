/**
 * UserRole — valores válidos para o campo `role` no modelo User do Prisma.
 *
 * O campo é armazenado como String no banco para evitar migrations destrutivas
 * de ALTER TYPE. Use este objeto como fonte de verdade no TypeScript.
 */
export const UserRole = {
  /** Paciente padrão — acessa o painel gamificado de saúde. */
  USER: 'USER',
  /** Administrador do sistema — acessa /admin. */
  ADMIN: 'ADMIN',
  /** Nutricionista — acessa o Dashboard de gestão de pacientes e Squads. */
  NUTRITIONIST: 'NUTRITIONIST',
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];
