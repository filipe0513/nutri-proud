import { execSync } from 'child_process'
import * as fs from 'fs'
import * as path from 'path'
import { Client } from 'pg'

/**
 * Global Setup do Playwright — Rodado UMA VEZ antes de todos os testes.
 *
 * Responsabilidades:
 * 1. Carregar variáveis do .env.test (banco de testes isolado)
 * 2. Criar o banco `nutriproud_test` se não existir
 * 3. Aplicar o schema Prisma no banco de testes via `db push`
 */
async function globalSetup() {
  console.log('\n🎭 [Playwright] Iniciando Global Setup...')

  // ── 1. Carregar .env.test ────────────────────────────────────────────────
  const envTestPath = path.resolve(process.cwd(), '.env.test')
  if (!fs.existsSync(envTestPath)) {
    throw new Error(
      '[globalSetup] Arquivo .env.test não encontrado! Crie-o a partir do .env.test.example'
    )
  }

  // Parsear manualmente o .env.test e injetar no process.env
  const envContent = fs.readFileSync(envTestPath, 'utf-8')
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIndex = trimmed.indexOf('=')
    if (eqIndex === -1) continue
    const key = trimmed.slice(0, eqIndex).trim()
    const value = trimmed.slice(eqIndex + 1).trim().replace(/^["']|["']$/g, '')
    process.env[key] = value
  }

  const testDbUrl = process.env.DATABASE_URL
  if (!testDbUrl || !testDbUrl.includes('nutriproud_test')) {
    throw new Error(
      `[globalSetup] DATABASE_URL não aponta para o banco de testes! Valor: ${testDbUrl}`
    )
  }

  console.log('✅ [globalSetup] .env.test carregado. Banco de testes:', testDbUrl)

  // ── 2. Criar banco nutriproud_test se não existir ────────────────────────
  const adminClient = new Client({
    connectionString: 'postgresql://postgres:pg123456@localhost:5432/postgres',
  })

  try {
    await adminClient.connect()
    const res = await adminClient.query(
      "SELECT 1 FROM pg_database WHERE datname = 'nutriproud_test'"
    )
    if (res.rowCount === 0) {
      await adminClient.query('CREATE DATABASE nutriproud_test')
      console.log('✅ [globalSetup] Banco "nutriproud_test" criado.')
    } else {
      console.log('ℹ️  [globalSetup] Banco "nutriproud_test" já existe.')
    }
  } catch (err) {
    console.error('[globalSetup] Erro ao criar banco de testes:', err)
    throw err
  } finally {
    await adminClient.end()
  }

  // ── 3. Aplicar schema Prisma no banco de testes ──────────────────────────
  console.log('🔄 [globalSetup] Aplicando schema Prisma no banco de testes...')
  try {
    execSync(`npx prisma db push --config=prisma.config.test.ts`, {
      stdio: 'pipe',
      env: {
        ...process.env,
        DATABASE_URL: testDbUrl,
      },
    })
    console.log('✅ [globalSetup] Schema Prisma aplicado com sucesso.')
  } catch (err) {
    console.error('[globalSetup] Erro ao aplicar schema Prisma:', err)
    throw err
  }

  console.log('🎭 [Playwright] Global Setup concluído!\n')
}

export default globalSetup
