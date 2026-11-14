import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  globalSetup: "./e2e/setup/global-setup.ts",
  globalTeardown: "./e2e/setup/global-teardown.ts",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: "http://localhost:3002",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: [
    {
      command: "npm --prefix server run dev",
      url: "http://localhost:3003/api/health",
      reuseExistingServer: !process.env.CI,
      timeout: 60 * 1000,
      env: {
        PORT: "3003",
        NODE_ENV: "test",
        CLIENT_URL: "http://localhost:3002",
        DATABASE_URL:
          process.env.TEST_DATABASE_URL ||
          "postgresql://postgres:2002@localhost:5434/helper_test_db?schema=public",
        BETTER_AUTH_SECRET: "test_better_auth_secret_minimum_32_characters_for_playwright",
        BETTER_AUTH_URL: "http://localhost:3003",
      },
    },
    {
      command: "npm --prefix client run dev",
      url: "http://localhost:3002",
      reuseExistingServer: !process.env.CI,
      timeout: 60 * 1000,
      env: {
        PORT: "3002",
        VITE_PROXY_TARGET: "http://127.0.0.1:3003",
      },
    },
  ],
});
