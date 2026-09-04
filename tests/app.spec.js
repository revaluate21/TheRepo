const { test, expect } = require('@playwright/test');

const weather = {
  latitude: 38.7,
  longitude: -9.1,
  timezone: 'Europe/Lisbon',
  current: {
    time: '2026-09-04T19:00',
    temperature_2m: 30,
    apparent_temperature: 31.2,
    weather_code: 0,
    wind_speed_10m: 18,
    precipitation: 0
  },
  daily: {
    time: ['2026-09-04','2026-09-05','2026-09-06','2026-09-07','2026-09-08','2026-09-09','2026-09-10'],
    sunrise: Array(7).fill('2026-09-04T07:10'),
    sunset: Array(7).fill('2026-09-04T20:02'),
    temperature_2m_max: [34,35,31,29,27,28,29],
    temperature_2m_min: [20,21,19,18,17,18,18],
    precipitation_probability_max: [0,0,5,12,20,10,0],
    weather_code: [0,0,1,2,2,1,0]
  }
};

async function mockWeather(page) {
  await page.route('**/api.open-meteo.com/**', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(weather)
  }));
}

test('home is photo-first, time-aware and complete', async ({ page }) => {
  const appErrors = [];
  page.on('pageerror', error => appErrors.push(error.message));
  await mockWeather(page);
  await page.goto('/?testHour=19&app=v30#home');
  await expect(page.locator('#bestNowTitle')).not.toHaveText('Finding your world…');
  await expect(page.locator('#fiveDayRow .day-card')).toHaveCount(5);
  await expect(page.locator('#worldGrid .world-card')).toHaveCount(8);
  await expect(page.locator('#moodRoutes .route-card')).toHaveCount(6);
  await expect(page.locator('#bestNowImage')).toHaveJSProperty('complete', true);
  expect(await page.locator('#bestNowImage').evaluate(img => img.naturalWidth)).toBeGreaterThan(500);
  await page.screenshot({ path: 'test-results/home-mobile.png', fullPage: true });
  expect(appErrors).toEqual([]);
});

test('route overview and phone-down walk work end to end', async ({ page, context }) => {
  const appErrors = [];
  page.on('pageerror', error => appErrors.push(error.message));
  await mockWeather(page);
  await page.goto('/?testHour=10&app=v30#route/lisbon-seven-hills');
  await expect(page.locator('#routeView')).toHaveClass(/active/);
  await expect(page.locator('#routeTitle')).toHaveText('Seven Hills Day');
  await expect(page.locator('#stopPreview .preview-card')).toHaveCount(13);
  await expect(page.locator('#getThereBtn')).toHaveAttribute('href', /travelmode=transit/);
  await expect(page.locator('#returnCheckBtn')).toHaveAttribute('href', /destination=38\.810871/);

  await page.locator('#startRouteBtn').click();
  await expect(page.locator('#walkView')).toHaveClass(/active/);
  await expect(page.locator('#navName')).toHaveText('Parque Eduardo VII');
  await page.locator('#toggleMapBtn').click();
  await expect(page.locator('#routeSvg path')).toHaveCount(2);
  expect(await page.locator('#routeSvg circle').count()).toBeGreaterThanOrEqual(13);

  // Trigger a second accurate watchPosition update so the arrival gate can confirm.
  await context.setGeolocation({ latitude: 38.73038, longitude: -9.15329, accuracy: 10 });
  await page.waitForTimeout(450);
  await context.setGeolocation({ latitude: 38.73039, longitude: -9.15328, accuracy: 10 });
  await expect(page.locator('#navStatus')).toHaveText('YOU’RE HERE');

  await page.locator('#reachedBtn').click();
  await expect(page.locator('#navName')).toHaveText('São Pedro de Alcântara');
  await page.locator('#photoInfoBtn').click();
  await expect(page.locator('#photoModal')).toHaveClass(/open/);
  await expect(page.locator('#modalCredit')).not.toHaveText('');
  await page.locator('#closeModal').click();
  await page.screenshot({ path: 'test-results/walk-mobile.png', fullPage: true });
  expect(appErrors).toEqual([]);
});

test('world routing, deep links and weather safety labels work', async ({ page }) => {
  await mockWeather(page);
  await page.goto('/?testHour=23&app=v30#world/sintra');
  await expect(page.locator('#worldView')).toHaveClass(/active/);
  await expect(page.locator('#worldTitle')).toHaveText('Sintra');
  await expect(page.locator('#worldRoutes .route-card')).toHaveCount(2);
  await page.locator('#worldRoutes .route-card').first().click();
  await expect(page.locator('#routeWeatherCallout')).toContainText('Not tonight');
  await expect(page.locator('#routeWarnings a')).toHaveAttribute('href', /parquesdesintra/);
});

test('installed app shell reloads offline after one successful visit', async ({ page, context }) => {
  await mockWeather(page);
  await page.goto('/?app=v30#home');
  await page.waitForFunction(() => navigator.serviceWorker?.controller || false, null, { timeout: 20_000 });
  await page.waitForTimeout(800);
  await context.setOffline(true);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.locator('#homeView')).toHaveClass(/active/);
  await expect(page.locator('#bestNowTitle')).not.toHaveText('');
  expect(await page.locator('#bestNowImage').evaluate(img => img.naturalWidth)).toBeGreaterThan(500);
});
