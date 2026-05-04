import { defineConfig, devices } from '@playwright/test';

// Assets use /blog-test/ prefix (GitHub Pages sub-path deployment).
// Serve the parent directory so those absolute paths resolve locally.
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['html', { open: 'never' }], ['list']],

  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'Desktop Chrome',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],

  webServer: {
    // Serve the parent directory so /blog-test/… URLs resolve correctly
    command: 'npx serve .. -p 3000 --no-clipboard',
    url: 'http://localhost:3000/blog-test/',
    reuseExistingServer: !process.env.CI,
    stdout: 'ignore',
    stderr: 'pipe',
  },
});
