import { test, expect } from '@playwright/test'
import { createTestUser, createTestSession, setNextAuthCookie } from '../utils/db'

async function setNextAuthCookieLocal(page: import('@playwright/test').Page, sessionToken: string) {
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

test('Check auth', async ({ page }) => {
  const user = await createTestUser()
  const token = await createTestSession(user.id)
  await setNextAuthCookieLocal(page, token)
  
  const res = await page.request.get('/api/users/profile')
  const body = await res.text()
  console.log('STATUS:', res.status())
  console.log('BODY:', body)
  expect(res.status()).toBe(200)
})
