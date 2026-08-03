import { test, expect } from '@playwright/test'
import {
  cleanDatabase,
  createTestUser,
  createTestSquad,
  createTestPost,
  addMemberToSquad,
  createTestSession,
  disconnectTestPrisma,
  getTestPrisma,
} from '../utils/db'

test.describe('🛡️ Integridade Multi-Squad: Isolamento de Dados e Rankings', () => {
  test.afterAll(async () => {
    await disconnectTestPrisma()
  })

  test.beforeEach(async () => {
    await cleanDatabase()
  })

  async function setNextAuthCookie(page: import('@playwright/test').Page, sessionToken: string) {
    await page.context().addCookies([
      {
        name: 'authjs.session-token',
        value: sessionToken,
        domain: 'localhost',
        path: '/',
        httpOnly: true,
        secure: false,
        sameSite: 'Lax',
      },
      {
        name: '__Secure-authjs.session-token',
        value: sessionToken,
        domain: 'localhost',
        path: '/',
        httpOnly: true,
        secure: true,
        sameSite: 'Lax',
      },
    ])
  }

  test('CT-06 — Isolamento de Publicação Direcionada (Cross-Pollination)', async ({ browser }) => {
    // Setup
    const userA = await createTestUser({ name: 'Usuário A', email: 'user-a-cross@e2e.test' })
    const userB = await createTestUser({ name: 'Usuário B', email: 'user-b-cross@e2e.test' })
    
    const squadX = await createTestSquad(userA.id, { name: 'Squad X' })
    const squadY = await createTestSquad(userA.id, { name: 'Squad Y' })
    
    // Usuário B está apenas no Squad Y
    await addMemberToSquad(userB.id, squadY.id, 'MEMBER')

    // Ação: Usuário A faz uma publicação direcionada exclusivamente ao feed do Squad X
    await createTestPost(userA.id, squadX.id, {
      content: 'Publicação Confidencial do Squad X 🤫',
    })

    // Validação: Usuário B no Squad Y NÃO deve ver o post
    const sessionTokenB = await createTestSession(userB.id)
    const contextB = await browser.newContext()
    const pageB = await contextB.newPage()
    await setNextAuthCookie(pageB, sessionTokenB)

    await pageB.goto(`/squads/${squadY.id}`)
    await pageB.waitForLoadState('networkidle')

    // Garante que a publicação do Usuário A não vazou para o Squad Y
    await expect(pageB.getByText('Publicação Confidencial do Squad X 🤫')).not.toBeVisible()

    await contextB.close()
  })

  test('CT-07 — Consolidação de Ranking Multi-Squad', async ({ browser }) => {
    // Setup
    const userA = await createTestUser({ name: 'Usuário A', email: 'user-a-ranking@e2e.test' })
    const userB = await createTestUser({ name: 'Usuário B', email: 'user-b-ranking@e2e.test' })
    
    const squadX = await createTestSquad(userA.id, { name: 'Squad X' })
    const squadY = await createTestSquad(userA.id, { name: 'Squad Y' })
    await addMemberToSquad(userB.id, squadY.id, 'MEMBER')

    // Ação: Registrar log de saúde global para o Usuário A (ex: Água 100%)
    const prisma = getTestPrisma()
    await prisma.dailyLog.create({
      data: {
        userId: userA.id,
        category: 'water',
        primaryValue: 100,
        eventTime: new Date(),
        source: 'E2E_TEST',
        details: { quantity_ml: 3000 },
      },
    })

    const sessionTokenA = await createTestSession(userA.id)
    const contextA = await browser.newContext()
    const pageA = await contextA.newPage()
    await setNextAuthCookie(pageA, sessionTokenA)

    // Validação 1: No Squad X, compartilhar e verificar a pontuação incrementada
    await pageA.goto(`/squads/${squadX.id}`)
    await pageA.waitForLoadState('networkidle')

    // Abre o drawer e compartilha o score no Squad X
    await pageA.getByRole('button', { name: /Nova publicação|Nutri/i }).first().click()
    await pageA.getByText('Compartilhar Score do Dia').click()
    
    // Aguarda a requisição e valida diretamente no banco para evitar flakiness de cache da UI
    await pageA.waitForTimeout(1500)
    const postX = await prisma.post.findFirst({
      where: { squadId: squadX.id, authorId: userA.id, content: { contains: 'Score' } }
    })
    expect(postX).toBeTruthy()
    const scoreTextX = postX!.content

    
    // Validação 2: No Squad Y, compartilhar e verificar que a MESMA pontuação global é refletida lá
    await pageA.goto(`/squads/${squadY.id}`)
    await pageA.waitForLoadState('networkidle')

    await pageA.getByRole('button', { name: /Nova publicação|Nutri/i }).first().click()
    await pageA.getByText('Compartilhar Score do Dia').click()

    await pageA.waitForTimeout(1500)
    const postY = await prisma.post.findFirst({
      where: { squadId: squadY.id, authorId: userA.id, content: { contains: 'Score' } }
    })
    expect(postY).toBeTruthy()
    const scoreTextY = postY!.content


    // Confirma que a pontuação consolidada é idêntica em ambos os Squads (não há silo de dados de saúde)
    expect(scoreTextX).toBe(scoreTextY)
    
    // Verifica que o score compartilhado é maior que 0 (já que o log foi registrado)
    const scoreNumber = parseInt(scoreTextX?.match(/\d+/)?.[0] || '0', 10)
    expect(scoreNumber).toBeGreaterThan(0)

    await contextA.close()
  })
})
