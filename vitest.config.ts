import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['**/*.test.ts'],
    exclude: ['node_modules', '.next', 'sdk'],
    coverage: {
      provider: 'v8',
      include: [
        'lib/query-parser.ts',
        'lib/wine-chunks.ts',
        'lib/prompts.ts',
        'lib/rate-limit.ts',
        'lib/memory.ts',
      ],
      reporter: ['text', 'text-summary'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
})
