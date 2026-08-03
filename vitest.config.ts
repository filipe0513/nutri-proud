import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'node',
    globals: true,
    // Apenas arquivos de unit test em src/ — os testes E2E em tests/e2e são do Playwright
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['tests/**', 'node_modules/**'],
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
