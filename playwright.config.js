import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  use: {
    baseURL: 'http://127.0.0.1:5173',
    trace: 'on-first-retry'
  },
  webServer: [
    {
      command: 'npm run dev -w server',
      port: 4010,
      reuseExistingServer: !process.env.CI
    },
    {
      command: 'npm run dev -w client',
      port: 5173,
      reuseExistingServer: !process.env.CI
    }
  ]
});
