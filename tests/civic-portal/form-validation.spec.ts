import { test, expect } from '@playwright/test';

const BUCHEN_URL = '/blog-test/civic-portal/termin/buchen/';

// The form uses React-controlled validation (noValidate is set), so we test
// the custom error states rather than browser-native constraint messages.

test.describe('Civic portal – booking form validation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BUCHEN_URL);
    await page.evaluate(() => localStorage.clear());
    await page.goto(BUCHEN_URL);
  });

  test('submitting an empty form does not navigate away', async ({ page }) => {
    await page.getByRole('button', { name: /Termin bestätigen/i }).click();
    await expect(page).toHaveURL(/buchen/);
  });

  test('empty name field triggers a visible error state', async ({ page }) => {
    await page.getByLabel(/E-Mail-Adresse/i).fill('test@example.de');
    await page.getByLabel(/Anliegen/i).selectOption('sonstiges');
    await page.getByLabel(/Datenschutz/i).check();
    await page.getByRole('button', { name: /Termin bestätigen/i }).click();

    const nameInput = page.getByLabel(/Vor- und Nachname/i);
    // Either aria-invalid is set, or an error message appears nearby
    const hasAriaInvalid = await nameInput.getAttribute('aria-invalid');
    const errorVisible = await page.getByText(/Name.*erforderlich|Pflichtfeld|required/i).isVisible().catch(() => false);
    expect(hasAriaInvalid === 'true' || errorVisible).toBeTruthy();
  });

  test('empty email field triggers a visible error state', async ({ page }) => {
    await page.getByLabel(/Vor- und Nachname/i).fill('Test User');
    await page.getByLabel(/Anliegen/i).selectOption('sonstiges');
    await page.getByLabel(/Datenschutz/i).check();
    await page.getByRole('button', { name: /Termin bestätigen/i }).click();

    const emailInput = page.getByLabel(/E-Mail-Adresse/i);
    const hasAriaInvalid = await emailInput.getAttribute('aria-invalid');
    const errorVisible = await page.getByText(/E-Mail.*erforderlich|Pflichtfeld|required/i).isVisible().catch(() => false);
    expect(hasAriaInvalid === 'true' || errorVisible).toBeTruthy();
  });

  test('invalid email format triggers a visible error state', async ({ page }) => {
    await page.getByLabel(/Vor- und Nachname/i).fill('Test User');
    await page.getByLabel(/E-Mail-Adresse/i).fill('not-an-email');
    await page.getByLabel(/Anliegen/i).selectOption('sonstiges');
    await page.getByLabel(/Datenschutz/i).check();
    await page.getByRole('button', { name: /Termin bestätigen/i }).click();

    // Should stay on the form page and show an error
    await expect(page).toHaveURL(/buchen/);
    const emailInput = page.getByLabel(/E-Mail-Adresse/i);
    const hasAriaInvalid = await emailInput.getAttribute('aria-invalid');
    const errorVisible = await page.getByText(/ungültig|E-Mail.*format|invalid/i).isVisible().catch(() => false);
    expect(hasAriaInvalid === 'true' || errorVisible).toBeTruthy();
  });

  test('unselected Anliegen (service type) blocks submission', async ({ page }) => {
    await page.getByLabel(/Vor- und Nachname/i).fill('Test User');
    await page.getByLabel(/E-Mail-Adresse/i).fill('test@example.de');
    // Leave Anliegen on the default "Bitte wählen…" option
    await page.getByLabel(/Datenschutz/i).check();
    await page.getByRole('button', { name: /Termin bestätigen/i }).click();
    await expect(page).toHaveURL(/buchen/);
  });

  test('unchecked Datenschutz (privacy consent) blocks submission', async ({ page }) => {
    await page.getByLabel(/Vor- und Nachname/i).fill('Test User');
    await page.getByLabel(/E-Mail-Adresse/i).fill('test@example.de');
    await page.getByLabel(/Anliegen/i).selectOption('sonstiges');
    // Do not check Datenschutz
    await page.getByRole('button', { name: /Termin bestätigen/i }).click();
    await expect(page).toHaveURL(/buchen/);
  });

  test('focus moves to first invalid field after failed submission', async ({ page }) => {
    // Submit completely empty form — focus should land on the Name input
    await page.getByRole('button', { name: /Termin bestätigen/i }).click();

    const nameInput = page.getByLabel(/Vor- und Nachname/i);
    // The "focus-on-error" feature should move focus to the first errored field
    await expect(nameInput).toBeFocused();
  });

  test('error on name field clears once valid input is provided', async ({ page }) => {
    // Trigger validation
    await page.getByRole('button', { name: /Termin bestätigen/i }).click();
    const nameInput = page.getByLabel(/Vor- und Nachname/i);

    // Fix the field
    await nameInput.fill('Valid Name');
    await nameInput.blur();

    // aria-invalid should be removed (or set to false)
    const ariaInvalid = await nameInput.getAttribute('aria-invalid');
    expect(ariaInvalid).not.toBe('true');
  });

  test('optional Anmerkungen field does not block submission when empty', async ({ page }) => {
    await page.getByLabel(/Vor- und Nachname/i).fill('Test User');
    await page.getByLabel(/E-Mail-Adresse/i).fill('test@example.de');
    await page.getByLabel(/Anliegen/i).selectOption('sonstiges');
    await page.getByLabel(/Datenschutz/i).check();
    // Anmerkungen intentionally left empty

    await page.getByRole('button', { name: /Termin bestätigen/i }).click();
    await expect(page).toHaveURL(/eingegangen/);
  });
});
