import { test, expect } from '@playwright/test'
import {
  cleanDatabase,
  createTestUser,
  createTestSession,
  disconnectTestPrisma,
} from '../utils/db'

test.describe('🛟 LifesaverDrawer', () => {
  test.afterAll(async () => {
    await disconnectTestPrisma()
  })

  test.beforeEach(async () => {
    await cleanDatabase()
  })

  test('CT-Lifesaver-01 — Deve mostrar botão salva-vidas e abrir a gaveta', async ({ browser }) => {
    // Note: We use fake timers or mock the time to force it to be >= 18h
    // But playwright doesn't support page.clock.setFixedTime for everything natively if we use hydration?
    // Actually Playwright 1.45+ supports page.clock! Let's test it.

    const user = await createTestUser()
    const sessionToken = await createTestSession(user.id)
    
    const context = await browser.newContext()
    
    // Set local time to 19:00 to trigger lifesaver
    const mockTime = new Date()
    mockTime.setHours(19, 0, 0, 0)
    await context.clock.setFixedTime(mockTime)

    const page = await context.newPage()
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

    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Find the Lifesaver button
    const lifesaverBtn = page.getByText(/Como salvo meu dia/i)
    await expect(lifesaverBtn).toBeVisible({ timeout: 8000 })

    await lifesaverBtn.click()

    // Wait for the drawer
    const drawerTitle = page.getByRole('heading', { name: /Missão Salva-Vidas/i })
    await expect(drawerTitle).toBeVisible()

    await context.close()
  })
})
