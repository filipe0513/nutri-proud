import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright Configuration — Orgulho da Nutri E2E
 *
 * Documentação: https://playwright.dev/docs/test-configuration
 *
 * Estratégia de banco de dados:
 * - O globalSetup carrega .env.test e aponta DATABASE_URL para `nutriproud_test`
 * - O Next.js (webServer) também roda com as variáveis de .env.test
 * - O banco de dev (`nutriproud`) nunca é tocado durante os testes
 */
export default defineConfig({
  // Diretório onde estão os arquivos de teste
  testDir: './tests/e2e',

  // Rodar todos os testes em paralelo (cada worker tem seu próprio BrowserContext)
  fullyParallel: true,

  // Falhar o build de CI se deixar `test.only` nos arquivos de teste
  forbidOnly: !!process.env.CI,

  // Número de retentativas em caso de falha (0 em dev, 2 em CI)
  retries: process.env.CI ? 2 : 0,

  // Número de workers paralelos (1 em dev para debug mais fácil, auto em CI)
  // Mantemos 1 worker localmente para evitar condições de corrida no banco de testes
  workers: process.env.CI ? '50%' : 1,

  // Formato dos relatórios de teste
  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['list'], // Output legível no terminal
  ],

  // Configurações globais para todos os testes
  use: {
    // URL base para navegação relativa (ex: page.goto('/welcome'))
    baseURL: 'http://localhost:3000',

    // Capturar trace apenas em caso de falha (útil para debug)
    trace: 'on-first-retry',

    // Screenshot apenas em caso de falha
    screenshot: 'only-on-failure',

    // Viewport padrão (mobile-first, alinhado com o design do app)
    viewport: { width: 390, height: 844 },
  },

  // ── Projetos de Browsers ─────────────────────────────────────────────────
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    // Para adicionar Mobile Safari, instale primeiro: npx playwright install webkit
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 13'] },
    // },
  ],

  // ── Setup e Teardown Globais ─────────────────────────────────────────────
  globalSetup: './tests/global-setup.ts',
  globalTeardown: './tests/global-teardown.ts',

  // ── WebServer — Levanta o Next.js antes dos testes ───────────────────────
  webServer: {
    // Levantar o Next.js em modo dev com as variáveis de .env.test
    command: 'dotenv -e .env.test -- next dev',
    url: 'http://localhost:3000',

    // Reusar servidor se já estiver rodando (útil durante desenvolvimento)
    reuseExistingServer: !process.env.CI,

    // Timeout para o servidor iniciar (2 minutos para Next.js compilar)
    timeout: 120_000,

    // Mostrar stdout/stderr do servidor nos logs (útil para debug)
    stdout: 'pipe',
    stderr: 'pipe',
  },
})
