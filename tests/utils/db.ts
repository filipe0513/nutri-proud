import { PrismaClient, Prisma } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import * as fs from 'fs'
import * as path from 'path'

// ── Carregar .env.test para garantir que o Prisma aponte para o banco de testes ──
// Isso é necessário quando o db.ts é importado diretamente nos testes (fora do webServer)
function loadTestEnv() {
  const envTestPath = path.resolve(process.cwd(), '.env.test')
  if (!fs.existsSync(envTestPath)) return

  const envContent = fs.readFileSync(envTestPath, 'utf-8')
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIndex = trimmed.indexOf('=')
    if (eqIndex === -1) continue
    const key = trimmed.slice(0, eqIndex).trim()
    const value = trimmed.slice(eqIndex + 1).trim().replace(/^["']|["']$/g, '')
    // Apenas setar se ainda não estiver definido (globalSetup já deve ter carregado)
    if (!process.env[key]) {
      process.env[key] = value
    }
  }
}

loadTestEnv()

// Garantir que nunca usamos o banco errado
const dbUrl = process.env.DATABASE_URL ?? ''
if (dbUrl && !dbUrl.includes('nutriproud_test') && !dbUrl.includes('test')) {
  throw new Error(
    `[tests/utils/db.ts] ATENÇÃO: DATABASE_URL não aponta para o banco de testes!\n` +
      `Valor atual: ${dbUrl}\n` +
      `Esperado: postgresql://...@.../nutriproud_test`
  )
}

// ── Instância do Prisma Client para testes ───────────────────────────────────
let prismaInstance: PrismaClient | null = null
let poolInstance: Pool | null = null

export function getTestPrisma(): PrismaClient {
  if (!prismaInstance) {
    // Usa o mesmo padrão da aplicação (src/lib/prisma.ts):
    // PrismaPg adapter com pg.Pool — obrigatório pelo engineType = "library" no schema.prisma
    poolInstance = new Pool({
      connectionString: process.env.DATABASE_URL,
    })
    const adapter = new PrismaPg(poolInstance)
    prismaInstance = new PrismaClient({
      adapter,
      log: process.env.PLAYWRIGHT_VERBOSE === 'true' ? ['query', 'error'] : ['error'],
    })
  }
  return prismaInstance
}

export async function disconnectTestPrisma(): Promise<void> {
  if (prismaInstance) {
    await prismaInstance.$disconnect()
    prismaInstance = null
  }
  if (poolInstance) {
    await poolInstance.end()
    poolInstance = null
  }
}

// ── cleanDatabase ────────────────────────────────────────────────────────────
/**
 * Deleta todos os dados do banco de testes respeitando a ordem das FK constraints.
 * Use no `beforeEach` ou `afterEach` para garantir isolamento entre testes.
 *
 * Ordem de deleção (leaf → root):
 * 1. Reaction, Comment (dependem de Post e User)
 * 2. Post (depende de Squad e User)
 * 3. SquadMember (depende de Squad e User)
 * 4. DailyLog, Notification, AiInsight, SystemEvent (dependem de User)
 * 5. Session, Account (dependem de User)
 * 6. VerificationToken, Squad (independentes ou já referências limpas)
 * 7. User (último — todos os outros dependem dele)
 */
export async function cleanDatabase(): Promise<void> {
  const prisma = getTestPrisma()

  await prisma.$transaction([
    prisma.reaction.deleteMany(),
    prisma.comment.deleteMany(),
    prisma.post.deleteMany(),
    prisma.squadMember.deleteMany(),
    prisma.dailyLog.deleteMany(),
    prisma.notification.deleteMany(),
    prisma.aiInsight.deleteMany(),
    prisma.systemEvent.deleteMany(),
    prisma.session.deleteMany(),
    prisma.account.deleteMany(),
    prisma.verificationToken.deleteMany(),
    prisma.squad.deleteMany(),
    prisma.user.deleteMany(),
  ])
}

// ── Tipos auxiliares para as factories ──────────────────────────────────────

export interface CreateTestUserOptions {
  email?: string
  name?: string
  role?: string
  isAnonymous?: boolean
  profile?: Record<string, unknown>
  targets?: Record<string, unknown>
}

export interface CreateTestSquadOptions {
  name?: string
  description?: string
}

export interface CreateTestPostOptions {
  content?: string
  imageUrl?: string
}

// ── createTestUser ───────────────────────────────────────────────────────────
/**
 * Cria um usuário de teste no banco de testes.
 *
 * @param overrides - Campos opcionais para sobrescrever os valores padrão
 * @returns O usuário criado pelo Prisma
 */
export async function createTestUser(overrides: CreateTestUserOptions = {}) {
  const prisma = getTestPrisma()
  const uniqueSuffix = Date.now() + Math.random().toString(36).slice(2, 7)

  return prisma.user.create({
    data: {
      email: overrides.email ?? `test-user-${uniqueSuffix}@e2e.test`,
      name: overrides.name ?? `Test User ${uniqueSuffix}`,
      role: overrides.role ?? 'USER',
      is_anonymous: overrides.isAnonymous ?? false,
      profile: (overrides.profile ?? {
        weight_kg: 70,
        height_cm: 170,
        gender: 'other',
        main_goal: 'health',
      }) as Prisma.InputJsonValue,
      targets: (overrides.targets ?? {
        water_ml_per_day: 2500,
        sleep_hours_per_night: 8,
      }) as Prisma.InputJsonValue,
    },
  })
}

// ── createTestSquad ──────────────────────────────────────────────────────────
/**
 * Cria um Squad de teste com o usuário passado como ADMIN.
 *
 * @param adminId - ID do usuário que será o administrador do Squad
 * @param overrides - Campos opcionais para sobrescrever os valores padrão
 * @returns O Squad criado (com o SquadMember ADMIN já incluído)
 */
export async function createTestSquad(
  adminId: string,
  overrides: CreateTestSquadOptions = {}
) {
  const prisma = getTestPrisma()
  const uniqueSuffix = Date.now() + Math.random().toString(36).slice(2, 7)

  return prisma.squad.create({
    data: {
      name: overrides.name ?? `Test Squad ${uniqueSuffix}`,
      description: overrides.description ?? 'Squad criado automaticamente para testes E2E',
      members: {
        create: {
          userId: adminId,
          role: 'ADMIN',
        },
      },
    },
    include: {
      members: true,
    },
  })
}

// ── createTestPost ───────────────────────────────────────────────────────────
/**
 * Cria uma publicação de teste no Squad especificado.
 *
 * @param userId - ID do autor da publicação
 * @param squadId - ID do Squad onde a publicação será criada
 * @param overrides - Campos opcionais para sobrescrever os valores padrão
 * @returns A publicação criada
 */
export async function createTestPost(
  userId: string,
  squadId: string,
  overrides: CreateTestPostOptions = {}
) {
  const prisma = getTestPrisma()

  return prisma.post.create({
    data: {
      content: overrides.content ?? '🏃 Treino concluído! Mais um dia de superação! 💪',
      imageUrl: overrides.imageUrl ?? null,
      type: 'USER_GENERATED',
      authorId: userId,
      squadId,
    },
    include: {
      author: true,
      squad: true,
    },
  })
}

// ── createTestDailyLog ───────────────────────────────────────────────────────
/**
 * Cria um log diário de teste para um usuário.
 *
 * @param userId - ID do usuário dono do log
 * @param category - Categoria do log (WATER, FOOD, SLEEP, WORKOUT, POOP)
 * @returns O log criado
 */
export async function createTestDailyLog(
  userId: string,
  category: 'WATER' | 'FOOD' | 'SLEEP' | 'WORKOUT' | 'POOP' = 'WATER'
) {
  const prisma = getTestPrisma()

  const detailsByCategory = {
    WATER: { amount_ml: 500, note: 'Copo de água' },
    FOOD: { meal_name: 'Almoço saudável', calories: 600 },
    SLEEP: { hours: 8, quality: 'good' },
    WORKOUT: { type: 'Musculação', duration_minutes: 45 },
    POOP: { consistency: 'normal', quantity: 'medium' },
  }

  return prisma.dailyLog.create({
    data: {
      userId,
      category,
      primaryValue: 75,
      eventTime: new Date(),
      source: 'E2E_TEST',
      details: detailsByCategory[category],
    },
  })
}

// ── addMemberToSquad ─────────────────────────────────────────────────────────
/**
 * Adiciona um usuário existente como MEMBER (ou outro role) em um Squad.
 * Útil para o CT-08 onde o Usuário B precisa estar no Squad do Usuário A.
 *
 * @param userId  - ID do usuário a ser adicionado
 * @param squadId - ID do Squad
 * @param role    - Role no Squad (padrão: 'MEMBER')
 * @returns O registro SquadMember criado
 */
export async function addMemberToSquad(
  userId: string,
  squadId: string,
  role: 'ADMIN' | 'MEMBER' = 'MEMBER'
) {
  const prisma = getTestPrisma()

  return prisma.squadMember.create({
    data: { userId, squadId, role },
  })
}

// ── createTestSession ────────────────────────────────────────────────────────
/**
 * Cria um registro de Session no banco de testes simulando um login via NextAuth.
 * O token retornado pode ser injetado como cookie `next-auth.session-token`
 * no contexto do Playwright para autenticar o browser sem OAuth real.
 *
 * @param userId - ID do usuário que terá a sessão criada
 * @returns O token de sessão a ser usado como cookie
 */
export async function createTestSession(userId: string): Promise<string> {
  const prisma = getTestPrisma()

  // Gera um UUIDv4 real para o sessionToken, pois o Auth.js espera UUIDs e não strings longas no modo database
  const crypto = require('crypto');
  const sessionToken = crypto.randomUUID();
  const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 dias

  await prisma.session.create({
    data: {
      sessionToken,
      userId,
      expires,
    },
  })

  return sessionToken
}

