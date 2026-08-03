// prisma.config.test.ts — Configuração do Prisma exclusiva para testes E2E
// Lê apenas o .env.test, garantindo isolamento total do banco de dev/prod
import { defineConfig } from 'prisma/config'

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    // DATABASE_URL é injetado pelo globalSetup a partir do .env.test
    url: process.env.DATABASE_URL ?? '',
  },
})
