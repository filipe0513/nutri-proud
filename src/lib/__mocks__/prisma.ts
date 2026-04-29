import { PrismaClient } from '@prisma/client'
import { mockDeep } from 'vitest-mock-extended'

// Simula o Prisma
export const prismaMock = mockDeep<PrismaClient>()
