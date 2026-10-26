const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  testMatch: '**/*.spec.js',
  fullyParallel: false,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:8000/Portfolio/',
    channel: process.env.PLAYWRIGHT_CHANNEL || 'chrome',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'python -m http.server 8000 --bind 127.0.0.1 --directory ..',
    url: 'http://127.0.0.1:8000/Portfolio/',
    reuseExistingServer: !process.env.CI,
  },
});
