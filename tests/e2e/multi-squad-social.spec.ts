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

/**
 * Testes E2E — Multi-Squad Privacy, Reações Optimistic UI & Administração de Grupos
 * (CT-04, CT-05, CT-06, CT-09, CT-10, CT-11)
 */

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Injeta o cookie de sessão NextAuth no contexto do browser.
 */
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

// ── Test Suites ───────────────────────────────────────────────────────────────

test.describe('🔒 CT-04, CT-05 & CT-06 — Privacidade e Isolamento Multi-Squad', () => {
  test.afterAll(async () => {
    await disconnectTestPrisma()
  })

  test.beforeEach(async () => {
    await cleanDatabase()
  })

  test('CT-04 — Usuário B (membro) DEVE visualizar o post do Usuário A no Squad X', async ({ browser }) => {
    // Arrange
    const userA = await createTestUser({ name: 'Usuário A', email: 'usuario-a@e2e.test' })
    const userB = await createTestUser({ name: 'Usuário B', email: 'usuario-b@e2e.test' })
    const squadX = await createTestSquad(userA.id, { name: 'Squad X Privacidade' })
    await addMemberToSquad(userB.id, squadX.id, 'MEMBER')

    const postA = await createTestPost(userA.id, squadX.id, {
      content: 'Publicação Privada do Squad X 🔒',
    })

    const sessionTokenB = await createTestSession(userB.id)

    // Act: Usuário B acessa Squad X
    const contextB = await browser.newContext()
    const pageB = await contextB.newPage()
    await setNextAuthCookie(pageB, sessionTokenB)

    await pageB.goto(`/squads/${squadX.id}`)
    await pageB.waitForLoadState('networkidle')

    // Assert: O post do Usuário A está visível para o Usuário B
    const postCard = pageB.locator(`[data-testid="post-card-${postA.id}"]`)
    await expect(postCard).toBeVisible({ timeout: 8000 })
    await expect(postCard.getByText('Publicação Privada do Squad X 🔒')).toBeVisible()

    await contextB.close()
  })

  test('CT-05 — Usuário C (membro de outro Squad) NÃO deve ver o Squad X no seu Hub/Feed', async ({ browser }) => {
    // Arrange
    const userA = await createTestUser({ name: 'Usuário A', email: 'user-a-hub@e2e.test' })
    const userC = await createTestUser({ name: 'Usuário C', email: 'user-c-hub@e2e.test' })

    const squadX = await createTestSquad(userA.id, { name: 'Squad X Exclusivo' })
    const squadY = await createTestSquad(userC.id, { name: 'Squad Y do Usuário C' })

    const sessionTokenC = await createTestSession(userC.id)

    // Act: Usuário C acessa o Hub de Grupos (/squads)
    const contextC = await browser.newContext()
    const pageC = await contextC.newPage()
    await setNextAuthCookie(pageC, sessionTokenC)

    await pageC.goto('/squads')
    await pageC.waitForLoadState('networkidle')

    // Assert: O Squad Y está visível, mas o Squad X NÃO está presente na listagem do Usuário C
    await expect(pageC.getByText(squadY.name)).toBeVisible({ timeout: 8000 })
    await expect(pageC.getByText(squadX.name)).not.toBeVisible()

    await contextC.close()
  })

  test('CT-06 — Usuário C NÃO deve conseguir ver o conteúdo do Squad X via URL direta (Bloqueio de Rota Direta)', async ({ browser }) => {
    // Arrange
    const userA = await createTestUser({ name: 'Usuário A Direct', email: 'user-a-direct@e2e.test' })
    const userC = await createTestUser({ name: 'Usuário C Direct', email: 'user-c-direct@e2e.test' })

    const squadX = await createTestSquad(userA.id, { name: 'Squad X Secreto' })
    await createTestSquad(userC.id, { name: 'Squad Y Normal' })

    const postA = await createTestPost(userA.id, squadX.id, {
      content: 'Conteúdo estritamente confidencial do Squad X 🤫',
    })

    const sessionTokenC = await createTestSession(userC.id)

    // Act: Usuário C força a navegação para /squads/[id-do-squad-x]
    const contextC = await browser.newContext()
    const pageC = await contextC.newPage()
    await setNextAuthCookie(pageC, sessionTokenC)

    await pageC.goto(`/squads/${squadX.id}`)
    await pageC.waitForLoadState('networkidle')

    // Assert 1: O post confidencial do Usuário A NÃO deve ser exibido no DOM
    const confidentialPost = pageC.getByText('Conteúdo estritamente confidencial do Squad X 🤫')
    await expect(confidentialPost).not.toBeVisible()

    // Assert 2: Chamadas diretas de API de backend para Squad X retornam 403 Forbidden
    const squadApiRes = await pageC.request.get(`/api/squads/${squadX.id}`)
    expect(squadApiRes.status()).toBe(403)

    const feedApiRes = await pageC.request.get(`/api/squads/${squadX.id}/posts`)
    expect(feedApiRes.status()).toBe(403)

    await contextC.close()
  })
})

test.describe('🔥 CT-09 — Reações e Optimistic UI', () => {
  test.afterAll(async () => {
    await disconnectTestPrisma()
  })

  test.beforeEach(async () => {
    await cleanDatabase()
  })

  test('CT-09 — deve incrementar e decrementar o contador de reações instantaneamente (Optimistic UI)', async ({ browser }) => {
    // Arrange
    const userA = await createTestUser({ name: 'Autor Post', email: 'autor@e2e.test' })
    const userB = await createTestUser({ name: 'Reagente B', email: 'reagente-b@e2e.test' })
    const squad = await createTestSquad(userA.id, { name: 'Squad Reações' })
    await addMemberToSquad(userB.id, squad.id, 'MEMBER')

    const post = await createTestPost(userA.id, squad.id, {
      content: 'Post de teste de Reações Optimistic UI 🔥',
    })

    const sessionTokenB = await createTestSession(userB.id)

    const contextB = await browser.newContext()
    const pageB = await contextB.newPage()
    await setNextAuthCookie(pageB, sessionTokenB)

    await pageB.goto(`/squads/${squad.id}`)
    await pageB.waitForLoadState('networkidle')

    // Localizar o card do post
    const postCard = pageB.locator(`[data-testid="post-card-${post.id}"]`)
    await expect(postCard).toBeVisible({ timeout: 8000 })

    // Act 1: Usuário B clica para reagir com 🔥
    const reactionBtn = postCard.locator('[data-testid="btn-reaction-🔥"]')
    await expect(reactionBtn).toBeVisible()
    await reactionBtn.click()

    // Assert 1 (Optimistic UI): Contador incrementa para "1"
    await expect(postCard.locator('[data-testid="btn-reaction-🔥"]').getByText('1')).toBeVisible({ timeout: 3000 })

    // Validação no banco via Prisma
    const prisma = getTestPrisma()
    await expect.poll(async () => {
      const reactionCount = await prisma.reaction.count({
        where: { postId: post.id, userId: userB.id, emoji: '🔥' },
      })
      return reactionCount
    }).toBe(1)

    // Act 2: Clicar novamente para remover a reação (Toggle off)
    await postCard.locator('[data-testid="btn-reaction-🔥"]').click()

    // Assert 2 (Optimistic UI): Contador volta ao estado inicial / sem "1"
    await expect.poll(async () => {
      const reactionCount = await prisma.reaction.count({
        where: { postId: post.id, userId: userB.id, emoji: '🔥' },
      })
      return reactionCount
    }).toBe(0)

    await contextC_or_B(contextB)
  })
})

test.describe('⚙️ CT-10 & CT-11 — Administração e Cascading Delete do Squad', () => {
  test.afterAll(async () => {
    await disconnectTestPrisma()
  })

  test.beforeEach(async () => {
    await cleanDatabase()
  })

  test('CT-10 — Usuário A (Admin) DEVE editar as configurações do Squad com sucesso', async ({ browser }) => {
    // Arrange
    const userA = await createTestUser({ name: 'Admin Squad', email: 'admin-a@e2e.test' })
    const squad = await createTestSquad(userA.id, {
      name: 'Squad Nome Original',
      description: 'Descrição Antiga',
    })

    const sessionTokenA = await createTestSession(userA.id)

    const contextA = await browser.newContext()
    const pageA = await contextA.newPage()
    await setNextAuthCookie(pageA, sessionTokenA)

    await pageA.goto(`/squads/${squad.id}`)
    await pageA.waitForLoadState('networkidle')

    // Act: Abrir gaveta de configurações
    const settingsBtn = pageA.locator('[data-testid="btn-squad-settings"]')
    await expect(settingsBtn).toBeVisible({ timeout: 8000 })
    await settingsBtn.click()

    // Preencher novos dados no formulário
    const inputName = pageA.locator('[data-testid="input-squad-name"]')
    await expect(inputName).toBeVisible()
    await inputName.fill('Squad Nome Atualizado')

    const inputDesc = pageA.locator('[data-testid="input-squad-description"]')
    await inputDesc.fill('Descrição Nova do Grupo')

    // Salvar alterações
    const saveBtn = pageA.locator('[data-testid="btn-save-squad-settings"]')
    await saveBtn.click()

    // Assert 1: A interface reflete o novo nome no header
    await expect(pageA.getByRole('heading', { name: 'Squad Nome Atualizado' })).toBeVisible({ timeout: 8000 })

    // Assert 2: Validação no banco via Prisma
    const prisma = getTestPrisma()
    const updatedSquad = await prisma.squad.findUnique({ where: { id: squad.id } })
    expect(updatedSquad?.name).toBe('Squad Nome Atualizado')
    expect(updatedSquad?.description).toBe('Descrição Nova do Grupo')

    await contextA.close()
  })

  test('CT-10 (RBAC) — Usuário B (Membro comum) NÃO deve ter acesso às opções de Admin nem conseguir editar/deletar via API', async ({ browser }) => {
    // Arrange
    const userA = await createTestUser({ name: 'Criador Squad', email: 'criador@e2e.test' })
    const userB = await createTestUser({ name: 'Membro Comum', email: 'membro@e2e.test' })
    const squad = await createTestSquad(userA.id, { name: 'Squad Protegido RBAC' })
    await addMemberToSquad(userB.id, squad.id, 'MEMBER')

    const sessionTokenB = await createTestSession(userB.id)

    const contextB = await browser.newContext()
    const pageB = await contextB.newPage()
    await setNextAuthCookie(pageB, sessionTokenB)

    await pageB.goto(`/squads/${squad.id}`)
    await pageB.waitForLoadState('networkidle')

    // Assert 1: O botão de configurações do Squad NÃO está visível para o membro comum
    const settingsBtn = pageB.locator('[data-testid="btn-squad-settings"]')
    await expect(settingsBtn).not.toBeVisible()

    // Assert 2: Tentativas diretas de edição via API retornam 403 Forbidden
    const editRes = await pageB.request.put(`/api/squads/${squad.id}`, {
      data: { name: 'Tentativa de Hack' },
    })
    expect(editRes.status()).toBe(403)

    // Assert 3: Tentativas diretas de deleção via API retornam 403 Forbidden
    const deleteRes = await pageB.request.delete(`/api/squads/${squad.id}`)
    expect(deleteRes.status()).toBe(403)

    await contextB.close()
  })

  test('CT-11 — Deleção do Squad pelo Admin DEVE acionar Cascading Delete e remover todas as publicações e membros do banco', async ({ browser }) => {
    // Arrange
    const userA = await createTestUser({ name: 'Admin Deleção', email: 'admin-delete@e2e.test' })
    const userB = await createTestUser({ name: 'Membro Afetado', email: 'membro-delete@e2e.test' })
    const squad = await createTestSquad(userA.id, { name: 'Squad para Ser Apagado' })
    await addMemberToSquad(userB.id, squad.id, 'MEMBER')

    const post1 = await createTestPost(userA.id, squad.id, { content: 'Post 1 do Squad Apagado' })
    const post2 = await createTestPost(userB.id, squad.id, { content: 'Post 2 do Squad Apagado' })

    const sessionTokenA = await createTestSession(userA.id)

    const contextA = await browser.newContext()
    const pageA = await contextA.newPage()
    await setNextAuthCookie(pageA, sessionTokenA)

    await pageA.goto(`/squads/${squad.id}`)
    await pageA.waitForLoadState('networkidle')

    // Act: Abrir gaveta de configurações e acionar deleção do Squad
    const settingsBtn = pageA.locator('[data-testid="btn-squad-settings"]')
    await settingsBtn.click()

    const openDeleteDialogBtn = pageA.locator('[data-testid="btn-open-delete-squad-dialog"]')
    await expect(openDeleteDialogBtn).toBeVisible()
    await openDeleteDialogBtn.click()

    const confirmDeleteBtn = pageA.locator('[data-testid="btn-confirm-delete-squad"]')
    await expect(confirmDeleteBtn).toBeVisible()
    await confirmDeleteBtn.click()

    // Assert 1: Redirecionamento para a página de Grupos (/squads)
    await pageA.waitForURL('/squads', { timeout: 8000 })

    // Assert 2 (Cascading Delete): Validação no banco via Prisma
    const prisma = getTestPrisma()

    // O Squad foi deletado
    const deletedSquad = await prisma.squad.findUnique({ where: { id: squad.id } })
    expect(deletedSquad).toBeNull()

    // Os membros do Squad foram deletados em cascata
    const members = await prisma.squadMember.findMany({ where: { squadId: squad.id } })
    expect(members).toHaveLength(0)

    // Os posts atrelados ao Squad foram deletados em cascata
    const posts = await prisma.post.findMany({ where: { id: { in: [post1.id, post2.id] } } })
    expect(posts).toHaveLength(0)

    await contextA.close()
  })
})

async function contextC_or_B(ctx: import('@playwright/test').BrowserContext) {
  await ctx.close()
}
