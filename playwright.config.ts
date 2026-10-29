import { defineConfig } from '@playwright/test'

// PW_PORT permite vários floors rodarem o Playwright ao mesmo tempo sem dividir o servidor
const port = process.env.PW_PORT ?? '5173'

export default defineConfig({
  testDir: 'e2e',
  use: { baseURL: `http://localhost:${port}` },
  webServer: { command: `npm run dev -- --port ${port} --strictPort`, url: `http://localhost:${port}`, reuseExistingServer: !process.env.PW_PORT },
})
