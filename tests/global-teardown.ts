/**
 * Global Teardown do Playwright — Rodado UMA VEZ após todos os testes.
 *
 * Responsabilidades:
 * - Liberar conexões abertas ao banco de testes
 * - Emitir log de finalização
 *
 * Nota: Não deletamos o banco de testes aqui pois é útil para inspeção
 * manual após falhas. Use `cleanDatabase()` nos beforeEach dos testes.
 */
async function globalTeardown() {
  console.log('\n🎭 [Playwright] Global Teardown concluído.')
  console.log(
    'ℹ️  O banco "nutriproud_test" foi mantido para inspeção. Execute cleanDatabase() nos testes para limpar entre runs.'
  )
}

export default globalTeardown
