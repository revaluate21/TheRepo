const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  timeout: 45_000,
  expect: { timeout: 8_000 },
  retries: 1,
  reporter: [['line'], ['html', { outputFolder: 'playwright-report', open: 'never' }]],
  use: {
    baseURL: 'http://127.0.0.1:8877',
    ...devices['Pixel 7'],
    locale: 'en-GB',
    timezoneId: 'Europe/Lisbon',
    permissions: ['geolocation'],
    geolocation: { latitude: 38.730377, longitude: -9.153298, accuracy: 12 },
    serviceWorkers: 'allow',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure'
  },
  projects: [{ name: 'mobile-chromium', use: { browserName: 'chromium' } }],
  webServer: {
    command: 'python3 -m http.server 8877',
    port: 8877,
    reuseExistingServer: false,
    timeout: 20_000
  }
});
