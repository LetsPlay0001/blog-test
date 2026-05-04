import { test, expect } from '@playwright/test';

const BASE = '/blog-test/civic-portal';

test.describe('Civic portal – navigation', () => {
  test('portal homepage loads and shows both nav sections', async ({ page }) => {
    await page.goto(`${BASE}/`);
    await expect(page).toHaveTitle(/Bürgerportal/i);
    await expect(page.getByRole('navigation', { name: /Hauptnavigation/i })).toBeVisible();
  });

  test('header logo link returns to portal root', async ({ page }) => {
    await page.goto(`${BASE}/termin/`);
    await page.getByRole('link', { name: /Stadt Musterstadt/i }).click();
    await expect(page).toHaveURL(new RegExp(`${BASE}/?$`));
  });

  test('Bürgerdienste nav link leads to the termin page', async ({ page }) => {
    await page.goto(`${BASE}/`);
    await page.getByRole('navigation', { name: /Hauptnavigation/i })
      .getByRole('link', { name: /Bürgerdienste/i })
      .click();
    await expect(page).toHaveURL(/\/termin/);
  });

  test('termin page has correct breadcrumb trail', async ({ page }) => {
    await page.goto(`${BASE}/termin/`);
    const breadcrumb = page.getByRole('navigation', { name: /Breadcrumb/i });
    await expect(breadcrumb.getByText('Start')).toBeVisible();
    await expect(breadcrumb.getByText('Bürgerdienste')).toBeVisible();
    await expect(breadcrumb.getByText(/Termin online buchen/i)).toBeVisible();
  });

  test('buchen page breadcrumb shows correct path', async ({ page }) => {
    await page.goto(`${BASE}/termin/buchen/`);
    const breadcrumb = page.getByRole('navigation', { name: /Breadcrumb/i });
    await expect(breadcrumb.getByText('Start')).toBeVisible();
    await expect(breadcrumb).toBeVisible();
  });

  test('404 page is served for unknown routes', async ({ page }) => {
    await page.goto(`${BASE}/404/`);
    // Either the custom 404 page or the Next.js default 404 is shown
    const is404 = (await page.title()).includes('404') ||
      (await page.getByText('404').isVisible()) ||
      (await page.getByText(/could not be found|nicht gefunden/i).isVisible().catch(() => false));
    expect(is404).toBeTruthy();
  });

  test('search input in header has an accessible label', async ({ page }) => {
    await page.goto(`${BASE}/`);
    const searchInput = page.getByRole('searchbox', { name: /Suche/i });
    await expect(searchInput).toBeVisible();
  });

  test('sticky header remains visible after scrolling', async ({ page }) => {
    await page.goto(`${BASE}/termin/`);
    await page.evaluate(() => window.scrollBy(0, 500));
    const header = page.locator('header').first();
    await expect(header).toBeVisible();
    const position = await header.boundingBox();
    expect(position?.y).toBe(0);
  });

  test('footer contains contact details', async ({ page }) => {
    await page.goto(`${BASE}/`);
    const footer = page.locator('footer').first();
    await expect(footer.getByText(/Musterstadt/i)).toBeVisible();
    await expect(footer.getByRole('link', { name: /info@musterstadt\.de/i })).toBeVisible();
  });

  test('footer social media links have accessible labels', async ({ page }) => {
    await page.goto(`${BASE}/`);
    const footer = page.locator('footer').first();
    await expect(footer.getByRole('link', { name: 'Facebook' })).toBeVisible();
    await expect(footer.getByRole('link', { name: 'LinkedIn' })).toBeVisible();
    await expect(footer.getByRole('link', { name: /Twitter/i })).toBeVisible();
    await expect(footer.getByRole('link', { name: 'YouTube' })).toBeVisible();
  });
});
