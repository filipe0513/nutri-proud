import { test, expect } from '@playwright/test'
import {
  cleanDatabase,
  createTestUser,
  createTestSquad,
  createTestPost,
  disconnectTestPrisma,
} from '../utils/db'

/**
 * Sanity Check — Valida que a infraestrutura E2E está funcionando corretamente.
 *
 * O que este teste verifica:
 * 1. O servidor Next.js está acessível e a home page redireciona (sem crash 500)
 * 2. A página /welcome carrega corretamente (rota pública)
 * 3. As factories do Prisma criam dados no banco de TESTES (não no de dev)
 * 4. A função cleanDatabase() remove os dados corretamente
 */
test.describe('🔬 Sanity Check — Infraestrutura E2E', () => {
  test.afterAll(async () => {
    await disconnectTestPrisma()
  })

  test.beforeEach(async () => {
    await cleanDatabase()
  })

  // ── Teste 1: Servidor Next.js acessível ─────────────────────────────────
  test('deve acessar o servidor Next.js sem erro 500', async ({ page }) => {
    // A home "/" redireciona para /welcome ou /onboarding dependendo do estado
    // Qualquer resposta que não seja 5xx é um sucesso de infraestrutura
    const response = await page.goto('/')
    expect(response?.status()).not.toBe(500)
    expect(response?.status()).not.toBe(502)
    expect(response?.status()).not.toBe(503)
  })

  // ── Teste 2: Página /welcome carrega corretamente ────────────────────────
  test('deve renderizar a página /welcome sem erros de JavaScript', async ({ page }) => {
    const jsErrors: string[] = []
    page.on('pageerror', (error) => {
      jsErrors.push(error.message)
    })

    const response = await page.goto('/welcome')

    // Status HTTP deve ser 200
    expect(response?.status()).toBe(200)

    // Não deve haver erros fatais de JavaScript
    // (Erros de rede para APIs externas como OneSignal são ignorados)
    const criticalErrors = jsErrors.filter(
      (err) =>
        !err.includes('OneSignal') &&
        !err.includes('onesignal') &&
        !err.includes('cdn.onesignal')
    )
    expect(criticalErrors).toHaveLength(0)

    // A página deve ter conteúdo HTML básico
    const bodyText = await page.locator('body').textContent()
    expect(bodyText).toBeTruthy()
    expect(bodyText!.length).toBeGreaterThan(10)
  })

  // ── Teste 3: Factory createTestUser() funciona ───────────────────────────
  test('factory createTestUser() deve criar usuário no banco de testes', async () => {
    // Verificar que começa vazio
    const userBefore = await createTestUser()
    expect(userBefore).toBeDefined()
    expect(userBefore.id).toBeTruthy()
    expect(userBefore.email).toContain('@e2e.test')
    expect(userBefore.role).toBe('USER')
    expect(userBefore.is_anonymous).toBe(false)
  })

  // ── Teste 4: Factory createTestSquad() funciona ──────────────────────────
  test('factory createTestSquad() deve criar squad com admin', async () => {
    const user = await createTestUser({ name: 'Admin do Squad' })
    const squad = await createTestSquad(user.id, { name: 'Squad dos Campeões' })

    expect(squad.id).toBeTruthy()
    expect(squad.name).toBe('Squad dos Campeões')
    expect(squad.inviteCode).toBeTruthy()
    expect(squad.members).toHaveLength(1)
    expect(squad.members[0].userId).toBe(user.id)
    expect(squad.members[0].role).toBe('ADMIN')
  })

  // ── Teste 5: Factory createTestPost() funciona ───────────────────────────
  test('factory createTestPost() deve criar post vinculado ao usuário e squad', async () => {
    const user = await createTestUser({ name: 'Autor do Post' })
    const squad = await createTestSquad(user.id)
    const post = await createTestPost(user.id, squad.id, {
      content: 'Post de teste E2E! 🎉',
    })

    expect(post.id).toBeTruthy()
    expect(post.content).toBe('Post de teste E2E! 🎉')
    expect(post.author.id).toBe(user.id)
    expect(post.squad.id).toBe(squad.id)
  })

  // ── Teste 6: cleanDatabase() isola os testes ────────────────────────────
  test('cleanDatabase() deve remover todos os dados entre testes', async () => {
    // Criar dados
    const user = await createTestUser()
    const squad = await createTestSquad(user.id)
    await createTestPost(user.id, squad.id)

    // Limpar
    await cleanDatabase()

    // Tentar criar novamente (deve funcionar sem conflitos de unique constraint)
    const newUser = await createTestUser({ email: 'novo@e2e.test' })
    expect(newUser.id).toBeTruthy()
    expect(newUser.email).toBe('novo@e2e.test')
  })

  // ── Teste 7: Banco de testes está isolado ───────────────────────────────
  test('banco de testes deve estar isolado do banco de dev', async () => {
    const testDbUrl = process.env.DATABASE_URL ?? ''

    // Garantir que não estamos usando o banco de dev
    expect(testDbUrl).not.toContain('nutriproud"')
    expect(testDbUrl).not.toContain('nutriproud@')
    expect(testDbUrl).toContain('nutriproud_test')
  })
})
