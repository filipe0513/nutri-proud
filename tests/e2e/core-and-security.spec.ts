import { test, expect } from '@playwright/test'
import {
  cleanDatabase,
  createTestUser,
  createTestSquad,
  createTestPost,
  createTestDailyLog,
  addMemberToSquad,
  createTestSession,
  disconnectTestPrisma,
  getTestPrisma,
} from '../utils/db'

/**
 * Testes E2E — Core Gamification (CT-01, CT-02, CT-03) & RBAC de Post (CT-08)
 *
 * Estratégia de autenticação:
 * - CT-01/02/03: Usuário anônimo via cookie `anon_user_id` (sem OAuth)
 * - CT-08:       Sessão NextAuth injetada diretamente no banco de testes e
 *                injetada como cookie `next-auth.session-token` no contexto do browser
 */

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Injeta o cookie de sessão anônimo no contexto do browser.
 * @param page  - Instância do Playwright Page
 * @param userId - ID do usuário anônimo criado no banco de testes
 */
async function setAnonymousCookie(page: import('@playwright/test').Page, userId: string) {
  await page.context().addCookies([
    {
      name: 'anon_user_id',
      value: userId,
      domain: 'localhost',
      path: '/',
      httpOnly: true,
      secure: false,
      sameSite: 'Lax',
    },
  ])
}

/**
 * Injeta o cookie de sessão NextAuth no contexto do browser,
 * simulando um login real sem OAuth.
 * @param page         - Instância do Playwright Page
 * @param sessionToken - Token gerado por createTestSession()
 */
async function setNextAuthCookie(page: import('@playwright/test').Page, sessionToken: string) {
  // Auth.js v5 (NextAuth beta) usa "authjs.session-token" por padrão
  await page.context().addCookies([
    {
      name: 'authjs.session-token',
      value: sessionToken,
      domain: 'localhost',
      path: '/',
      httpOnly: true,
      secure: false,
      sameSite: 'Lax',
    }
  ])
}

/**
 * POST /api/logs para criar um log via API (com o cookie de autenticação já setado).
 * Retorna o log criado ou lança erro.
 */
async function postLog(
  page: import('@playwright/test').Page,
  category: 'water' | 'food' | 'workout' | 'sleep' | 'poop',
  primaryValue: number,
  details: Record<string, unknown>,
) {
  const response = await page.request.post('/api/logs', {
    data: {
      category,
      primary_value: primaryValue,
      event_time: new Date().toISOString(),
      details,
    },
  })
  return response
}

// ── Test Suite ────────────────────────────────────────────────────────────────

test.describe('🎮 CT-01 & CT-02 — Gamificação: Estado de Glória', () => {
  test.afterAll(async () => {
    await disconnectTestPrisma()
  })

  test.beforeEach(async () => {
    await cleanDatabase()
  })

  // ── CT-01: Conclusão parcial — sem glória ──────────────────────────────────
  test('CT-01 — deve exibir score parcial quando apenas Água está concluída', async ({ page }) => {
    // Arrange: usuário anônimo com apenas 1 pilar registrado (Água)
    const user = await createTestUser({ isAnonymous: true, name: 'CT01 User' })
    await setAnonymousCookie(page, user.id)

    // Registrar apenas água (primaryValue alto para atingir 100% nesse pilar)
    await createTestDailyLog(user.id, 'WATER')

    // Act: navegar para o dashboard
    await page.goto('/')

    // Aguardar o ScoreCard carregar
    await page.waitForLoadState('networkidle')

    // Assert: score deve ser inferior a 100 (apenas 1 de 5 pilares completo)
    // O ScoreCard exibe mensagem baseada no score; abaixo de 100 não mostra "Dia incrível!"
    await expect(page.getByText('Dia incrível! 🏆')).not.toBeVisible({ timeout: 5000 })

    // Verifica que os círculos de progresso estão presentes (5 pilares)
    const storySection = page.getByText('Progresso de hoje')
    await expect(storySection).toBeVisible()

    // Verifica que o Score Card está presente e mostrando um score (não 0 estático)
    // O ScoreCard renderiza "/100" para qualquer score
    await expect(page.getByText('/100')).toBeVisible()
  })

  // ── CT-02: Conclusão total — Estado de Glória ──────────────────────────────
  test('CT-02 — deve exibir "Dia incrível! 🏆" quando todos os 5 pilares estão completos', async ({ page }) => {
    // Arrange: usuário anônimo com todos os 5 pilares com score alto
    const user = await createTestUser({ isAnonymous: true, name: 'CT02 Glory User' })
    await setAnonymousCookie(page, user.id)

    // Criar logs de alta nota para todos os 5 pilares no DB de testes
    // (primaryValue = 100 garante score máximo em cada pilar)
    const prisma = getTestPrisma()
    const now = new Date()

    await Promise.all([
      // Água: criamos via log com quantity_ml alto (3000ml > meta de 2500ml)
      prisma.dailyLog.create({
        data: {
          userId: user.id,
          category: 'water',
          primaryValue: 100,
          eventTime: now,
          source: 'E2E_TEST',
          details: { quantity_ml: 3000 },
        },
      }),
      // Comida: 3 refeições registradas
      prisma.dailyLog.create({
        data: {
          userId: user.id,
          category: 'food',
          primaryValue: 100,
          eventTime: now,
          source: 'E2E_TEST',
          details: { meal_type: 'cafe_da_manha', name: 'Café da manhã saudável' },
        },
      }),
      prisma.dailyLog.create({
        data: {
          userId: user.id,
          category: 'food',
          primaryValue: 100,
          eventTime: now,
          source: 'E2E_TEST',
          details: { meal_type: 'almoco', name: 'Almoço balanceado' },
        },
      }),
      prisma.dailyLog.create({
        data: {
          userId: user.id,
          category: 'food',
          primaryValue: 100,
          eventTime: now,
          source: 'E2E_TEST',
          details: { meal_type: 'jantar', name: 'Jantar leve' },
        },
      }),
      // Treino
      prisma.dailyLog.create({
        data: {
          userId: user.id,
          category: 'workout',
          primaryValue: 100,
          eventTime: now,
          source: 'E2E_TEST',
          details: { type: 'Musculação', duration_minutes: 60 },
        },
      }),
      // Sono
      prisma.dailyLog.create({
        data: {
          userId: user.id,
          category: 'sleep',
          primaryValue: 100,
          eventTime: now,
          source: 'E2E_TEST',
          details: { duration_hours: 8, quality_feeling: 'revigorado', awoke_times: 0 },
        },
      }),
      // Intestino
      prisma.dailyLog.create({
        data: {
          userId: user.id,
          category: 'poop',
          primaryValue: 100,
          eventTime: now,
          source: 'E2E_TEST',
          details: { consistency: 'normal', state: 'normal' },
        },
      }),
    ])

    // Act: navegar para o dashboard
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Assert 1: "Dia incrível! 🏆" deve aparecer no ScoreCard
    await expect(page.getByText('Dia incrível! 🏆')).toBeVisible({ timeout: 8000 })

    // Assert 2: O score numérico deve ser alto (100 ou próximo)
    // O ScoreCard exibe o número antes de "/100"
    const scoreText = await page.locator('span.text-white').filter({ hasText: /^\d+$/ }).first().textContent()
    const scoreNum = parseInt(scoreText ?? '0', 10)
    expect(scoreNum).toBeGreaterThanOrEqual(80)

    // Assert 3: Persistência após reload — o estado de glória deve ser mantido
    await page.reload()
    await page.waitForLoadState('networkidle')
    await expect(page.getByText('Dia incrível! 🏆')).toBeVisible({ timeout: 8000 })
  })
})

// ── CT-03: Share Drawer com Foto de Fundo ─────────────────────────────────────

test.describe('📸 CT-03 — Share Drawer: Prévia com Foto de Fundo', () => {
  test.afterAll(async () => {
    await disconnectTestPrisma()
  })

  test.beforeEach(async () => {
    await cleanDatabase()
  })

  test('CT-03 — deve exibir sticker de score e estrutura de pré-visualização no Share Drawer', async ({ page }) => {
    // Arrange: usuário com 100% de completude para o share drawer ter dados
    const user = await createTestUser({ isAnonymous: true, name: 'CT03 Share User' })
    await setAnonymousCookie(page, user.id)

    // Criar logs completos para todos os pilares
    const prisma = getTestPrisma()
    const now = new Date()
    await Promise.all([
      prisma.dailyLog.create({ data: { userId: user.id, category: 'water', primaryValue: 100, eventTime: now, source: 'E2E_TEST', details: { quantity_ml: 3000 } } }),
      prisma.dailyLog.create({ data: { userId: user.id, category: 'food', primaryValue: 100, eventTime: now, source: 'E2E_TEST', details: { meal_type: 'almoco', name: 'Almoço' } } }),
      prisma.dailyLog.create({ data: { userId: user.id, category: 'workout', primaryValue: 100, eventTime: now, source: 'E2E_TEST', details: { type: 'Corrida', duration_minutes: 30 } } }),
      prisma.dailyLog.create({ data: { userId: user.id, category: 'sleep', primaryValue: 100, eventTime: now, source: 'E2E_TEST', details: { duration_hours: 8, quality_feeling: 'revigorado', awoke_times: 0 } } }),
      prisma.dailyLog.create({ data: { userId: user.id, category: 'poop', primaryValue: 100, eventTime: now, source: 'E2E_TEST', details: { consistency: 'normal', state: 'normal' } } }),
    ])

    // Act: navegar para o dashboard
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Abrir o Share Drawer via BottomNav ou botão de compartilhar
    // O BottomNav tem o botão com label 'Nutri' (aria-label="Nutri")
    const shareButton = page.getByRole('button', { name: /nutri/i }).first()
    await shareButton.click()

    // Aguardar o drawer abrir (cuidado com overlay do nextjs, preferir o seletor do vaul)
    const drawerContent = page.locator('[data-vaul-drawer]')
    await expect(drawerContent).toBeVisible({ timeout: 5000 })

    // Clicar em "Gerar Imagens e Stickers" para carregar o infográfico
    const generateBtn = page.getByRole('button', { name: /gerar imagens/i }).or(
      page.locator('#btn-generate-infographic')
    )
    await generateBtn.click()

    // Aguardar o carregamento do infográfico
    await page.waitForTimeout(3000) // aguarda cálculo de scores

    // Após gerar, deve aparecer a opção de "CARD" selecionada por padrão
    // Verificar que a pré-visualização está visível
    const previewSection = page.getByText('Pré-visualização')
    await expect(previewSection).toBeVisible({ timeout: 8000 })

    // Verificar que o botão "Foto de Fundo" existe (CARD mode)
    const bgPhotoButton = page.getByRole('button', { name: /foto de fundo/i }).or(
      page.getByRole('button', { name: /adicionar foto/i })
    )
    await expect(bgPhotoButton).toBeVisible()

    // Verificar que o elemento de preview está presente no DOM
    // O infográfico renderizado usa <ShareableInfographic> ou <ShareableSticker>
    // que têm estrutura SVG ou divs com cores de categoria
    const previewContainer = page.locator('div').filter({ hasText: 'Pré-visualização' }).locator('..').locator('div').nth(1)
    await expect(previewContainer).toBeVisible()
  })
})

// ── CT-08: RBAC de Post no Squad Feed ─────────────────────────────────────────

test.describe('🔐 CT-08 — RBAC: Segurança de Publicações no Squad', () => {
  test.afterAll(async () => {
    await disconnectTestPrisma()
  })

  test.beforeEach(async () => {
    await cleanDatabase()
  })

  test('CT-08 — Usuário B NÃO deve ver botão de deletar o post do Usuário A', async ({ browser }) => {
    // Arrange: criar Usuário A (admin do Squad X) e Usuário B (membro)
    const userA = await createTestUser({ name: 'Usuário A', email: 'usuario-a@e2e.test' })
    const userB = await createTestUser({ name: 'Usuário B', email: 'usuario-b@e2e.test' })
    const squad = await createTestSquad(userA.id, { name: 'Squad X para RBAC' })

    // Adicionar Usuário B como MEMBER do Squad X
    await addMemberToSquad(userB.id, squad.id, 'MEMBER')

    // Criar um post do Usuário A no Squad X
    const post = await createTestPost(userA.id, squad.id, {
      content: 'Post do Usuário A — CT-08 🔐',
    })

    // Criar sessões NextAuth para ambos os usuários
    const sessionTokenB = await createTestSession(userB.id)

    // ── Sessão do Usuário B ──────────────────────────────────────────────────
    const contextB = await browser.newContext()
    const pageB = await contextB.newPage()
    await setNextAuthCookie(pageB, sessionTokenB)

    // Navegar para o feed do Squad X como Usuário B
    await pageB.goto(`/squads/${squad.id}`)
    await pageB.waitForLoadState('networkidle')

    // Assert 1: O post do Usuário A está visível
    const postCard = pageB.locator(`[data-testid="post-card-${post.id}"]`)
    await expect(postCard).toBeVisible({ timeout: 8000 })
    await expect(postCard.getByText('Post do Usuário A — CT-08 🔐')).toBeVisible()

    // Assert 2: O botão de deletar NÃO deve existir para o Usuário B
    const deleteButtonB = postCard.locator('[data-testid="btn-delete-post"]')
    await expect(deleteButtonB).not.toBeVisible()

    // Assert 3: Tentativa direta via API — deve retornar 403
    const apiResponse = await pageB.request.delete(`/api/posts/${post.id}`)
    expect(apiResponse.status()).toBe(403)

    await contextB.close()
  })

  test('CT-08 — Usuário A DEVE poder deletar o próprio post e o DOM deve atualizar', async ({ browser }) => {
    // Arrange
    const userA = await createTestUser({ name: 'Usuário A Owner', email: 'usuario-a-owner@e2e.test' })
    const squad = await createTestSquad(userA.id, { name: 'Squad X Owner Test' })
    const post = await createTestPost(userA.id, squad.id, {
      content: 'Post para ser deletado pelo Usuário A 🗑️',
    })

    // Criar sessão NextAuth para Usuário A
    const sessionTokenA = await createTestSession(userA.id)

    // ── Sessão do Usuário A ──────────────────────────────────────────────────
    const contextA = await browser.newContext()
    const pageA = await contextA.newPage()
    await setNextAuthCookie(pageA, sessionTokenA)

    // Navegar para o feed do Squad
    await pageA.goto(`/squads/${squad.id}`)
    await pageA.waitForLoadState('networkidle')

    // Assert 1: O post está visível
    const postCard = pageA.locator(`[data-testid="post-card-${post.id}"]`)
    await expect(postCard).toBeVisible({ timeout: 8000 })
    await expect(postCard.getByText('Post para ser deletado pelo Usuário A 🗑️')).toBeVisible()

    // Assert 2: O botão de deletar está visível para o Usuário A (autor)
    const deleteButton = postCard.locator('[data-testid="btn-delete-post"]')
    await expect(deleteButton).toBeVisible()

    // Act: clicar no botão de deletar e confirmar no dialog
    pageA.on('dialog', async (dialog) => {
      expect(dialog.message()).toContain('Tem certeza')
      await dialog.accept()
    })
    await deleteButton.click()

    // Assert 3: O post deve sumir do DOM em tempo real
    await expect(postCard).not.toBeVisible({ timeout: 8000 })

    // Assert 4: Verificar no banco de dados (via Prisma assertion) que o post foi apagado
    const prisma = getTestPrisma()
    const deletedPost = await prisma.post.findUnique({ where: { id: post.id } })
    expect(deletedPost).toBeNull()

    await contextA.close()
  })

  test('CT-08 — API deve retornar 401 para requisição sem autenticação', async ({ request }) => {
    // Arrange: criar post no banco de testes
    const user = await createTestUser({ name: 'Dono do Post' })
    const squad = await createTestSquad(user.id)
    const post = await createTestPost(user.id, squad.id)

    // Act: tentar deletar sem cookie de autenticação
    const response = await request.delete(`/api/posts/${post.id}`)

    // Assert: deve retornar 401 Unauthorized
    expect(response.status()).toBe(401)
  })
})
