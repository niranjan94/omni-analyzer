import tsconfigPaths from 'vite-tsconfig-paths'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    coverage: {
      enabled: true,
      provider: 'v8'
    },
    reporters: process.env.GITHUB_ACTIONS ? ['dot', 'github-actions', 'junit'] : ['default'],
    outputFile: process.env.GITHUB_ACTIONS ? 'test-report.junit.xml' : undefined,
    deps: {
      interopDefault: false,
    },
  },
})
