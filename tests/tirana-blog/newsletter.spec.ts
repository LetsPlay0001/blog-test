import { test, expect } from '@playwright/test';

const BLOG_URL = '/blog-test/tirana-blog/';

test.describe('Tirana blog – newsletter', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BLOG_URL);
    await page.evaluate(() => localStorage.clear());
    await page.goto(BLOG_URL);
  });

  test('newsletter section is visible on the homepage', async ({ page }) => {
    // Newsletter is typically a section containing an email input
    const emailInput = page.getByRole('textbox', { name: /e-mail|newsletter|email/i }).or(
      page.locator('input[type="email"]').first(),
    );
    await expect(emailInput).toBeVisible();
  });

  test('newsletter email input accepts a valid address', async ({ page }) => {
    const emailInput = page.locator('input[type="email"]').first();
    await emailInput.fill('subscriber@example.com');
    await expect(emailInput).toHaveValue('subscriber@example.com');
  });

  test('newsletter form submission shows a success toast or confirmation', async ({ page }) => {
    const emailInput = page.locator('input[type="email"]').first();
    await emailInput.fill('subscriber@example.com');

    // Submit via the associated button or pressing Enter
    const submitBtn = page.locator('button[type="submit"]').or(
      page.getByRole('button', { name: /abonnieren|subscribe|anmelden|bestätigen/i }),
    ).first();

    if (await submitBtn.isVisible()) {
      await submitBtn.click();
    } else {
      await emailInput.press('Enter');
    }

    // A success toast, confirmation message, or state change should appear
    const successVisible =
      (await page.getByRole('status').isVisible().catch(() => false)) ||
      (await page.getByRole('alert').isVisible().catch(() => false)) ||
      (await page.getByText(/danke|erfolg|success|bestätigt|subscribed/i).isVisible().catch(() => false));

    expect(successVisible).toBeTruthy();
  });

  test('newsletter email persists when returning to the page without submitting', async ({ page }) => {
    const emailInput = page.locator('input[type="email"]').first();
    await emailInput.fill('draft@example.com');

    // Navigate away and come back
    await page.goto('/blog-test/');
    await page.goto(BLOG_URL);

    // Persisted draft should be restored
    const restoredInput = page.locator('input[type="email"]').first();
    await expect(restoredInput).toHaveValue('draft@example.com');
  });

  test('empty newsletter submission does not show a success state', async ({ page }) => {
    const submitBtn = page.locator('button[type="submit"]').or(
      page.getByRole('button', { name: /abonnieren|subscribe|anmelden/i }),
    ).first();

    if (await submitBtn.isVisible()) {
      await submitBtn.click();
      // Success toast/alert should NOT be visible
      const successVisible = await page.getByText(/danke|erfolg|success|bestätigt|subscribed/i).isVisible().catch(() => false);
      expect(successVisible).toBeFalsy();
    }
  });
});
