import { defineConfig, devices } from "@playwright/test";

const isCI = Boolean(process.env.CI);
// CI builds and verifies the export in its own step, overlapping the
// Playwright browser install; there the web server only serves out/.
const skipBuild = Boolean(process.env.PW_SKIP_BUILD);
const serveCommand =
  "npm run start -- --listen tcp://127.0.0.1:3000 --no-clipboard --no-port-switching";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: isCI ? 4 : undefined,
  reporter: [["list"], ["html", { outputFolder: "playwright-report", open: "never" }]],
  use: {
    baseURL: "http://127.0.0.1:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    actionTimeout: 10000,
    navigationTimeout: 30000,
    permissions: ["clipboard-read", "clipboard-write"],
  },
  projects: [
    {
      name: "webkit-mobile",
      grep: /@webkit\b/,
      use: { ...devices["iPhone 13"], permissions: [] },
    },
    {
      name: "chromium-desktop",
      grepInvert: /@mobile-only\b/,
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1440, height: 900 },
      },
    },
    {
      name: "chromium-mobile",
      grep: /@mobile(?:-only)?\b/,
      use: { ...devices["Pixel 5"] },
    },
  ],
  webServer: {
    command: skipBuild ? serveCommand : `npm run build && ${serveCommand}`,
    url: "http://127.0.0.1:3000/",
    reuseExistingServer: false,
    timeout: 120000,
  },
});
