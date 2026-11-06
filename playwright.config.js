import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "./test",
  testMatch: "**/*.spec.js",
  timeout: 30_000,
  expect: { timeout: 3_000 },
  retries: process.env.CI ? 1 : 0,
  fullyParallel: true,
  reporter: "list",
  webServer: { command: "bun run dev", port: 4867, reuseExistingServer: !process.env.CI },
  use: { baseURL: "http://127.0.0.1:4867", trace: process.env.CI ? "on-first-retry" : "retain-on-failure" },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
  ],
});
