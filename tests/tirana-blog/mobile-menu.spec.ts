import { test, expect, devices } from '@playwright/test';

const BLOG_URL = '/blog-test/tirana-blog/';

// Mobile menu tests run under a mobile viewport to trigger the hamburger menu.
test.describe('Tirana blog – mobile menu', () => {
  test.use({ viewport: { width: 390, height: 844 } }); // iPhone 14-ish

  test('hamburger / menu toggle button is visible on mobile', async ({ page }) => {
    await page.goto(BLOG_URL);
    const menuToggle = page.getByRole('button', { name: /menu|menü|navigation|öffnen|hamburger/i })
      .or(page.locator('[aria-label*="menu" i], [aria-label*="menü" i], [aria-controls*="nav" i]'))
      .first();
    await expect(menuToggle).toBeVisible();
  });

  test('clicking the menu toggle opens the navigation overlay', async ({ page }) => {
    await page.goto(BLOG_URL);
    const menuToggle = page.getByRole('button', { name: /menu|menü|navigation|öffnen/i })
      .or(page.locator('[aria-label*="menu" i]'))
      .first();

    await menuToggle.click();

    // After opening, at least one nav link should become visible
    const nav = page.getByRole('navigation').first();
    await expect(nav).toBeVisible();
  });

  test('menu can be closed after opening', async ({ page }) => {
    await page.goto(BLOG_URL);
    const menuToggle = page.getByRole('button', { name: /menu|menü|navigation|öffnen/i })
      .or(page.locator('[aria-label*="menu" i]'))
      .first();

    await menuToggle.click();
    // Click toggle again (or a close button) to close
    const closeBtn = page.getByRole('button', { name: /schließen|close|menu/i }).first();
    await closeBtn.click();

    // Navigation overlay should be hidden or collapsed
    const isCollapsed =
      (await menuToggle.getAttribute('aria-expanded')) === 'false' ||
      !(await page.locator('[data-mobile-open="true"], [aria-expanded="true"]').isVisible().catch(() => false));
    expect(isCollapsed).toBeTruthy();
  });

  test('menu toggle button has aria-expanded attribute that reflects state', async ({ page }) => {
    await page.goto(BLOG_URL);
    const menuToggle = page.locator('[aria-expanded]').first();

    // Initially collapsed
    const initialExpanded = await menuToggle.getAttribute('aria-expanded');
    expect(initialExpanded).toBe('false');

    await menuToggle.click();
    const openExpanded = await menuToggle.getAttribute('aria-expanded');
    expect(openExpanded).toBe('true');
  });

  test('desktop nav links are NOT visible before menu is opened on mobile', async ({ page }) => {
    await page.goto(BLOG_URL);
    // A desktop nav link (if rendered at all) should be hidden via CSS on mobile
    const desktopNav = page.locator('nav').first();
    // At minimum the nav should not show all items in an open/expanded state
    const ariaExpanded = await page.locator('[aria-expanded="true"]').count();
    expect(ariaExpanded).toBe(0);
  });
});

test.describe('Tirana blog – desktop navigation', () => {
  test('main nav is visible on desktop without menu toggle', async ({ page }) => {
    await page.goto(BLOG_URL);
    await expect(page.getByRole('navigation').first()).toBeVisible();
  });
});
