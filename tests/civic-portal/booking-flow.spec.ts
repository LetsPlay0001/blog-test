import { test, expect } from '@playwright/test';

const TERMIN_URL = '/blog-test/civic-portal/termin/';
const BUCHEN_URL = '/blog-test/civic-portal/termin/buchen/';
const EINGEGANGEN_URL = '/blog-test/civic-portal/eingegangen/';

test.describe('Civic portal – booking flow', () => {
  test.beforeEach(async ({ page }) => {
    // Clear persisted bookings before each test to avoid cross-test pollution
    await page.goto(BUCHEN_URL);
    await page.evaluate(() => localStorage.clear());
  });

  test('termin info page has a CTA that leads to the booking form', async ({ page }) => {
    await page.goto(TERMIN_URL);
    await expect(page.getByRole('heading', { name: /Termin online buchen/i })).toBeVisible();
    await page.getByRole('link', { name: /Termin buchen/i }).click();
    await expect(page).toHaveURL(/termin\/buchen/);
  });

  test('booking form renders all required fields', async ({ page }) => {
    await page.goto(BUCHEN_URL);
    await expect(page.getByLabel(/Vor- und Nachname/i)).toBeVisible();
    await expect(page.getByLabel(/E-Mail-Adresse/i)).toBeVisible();
    await expect(page.getByLabel(/Anliegen/i)).toBeVisible();
    await expect(page.getByLabel(/Anmerkungen/i)).toBeVisible();
    await expect(page.getByLabel(/Datenschutz/i)).toBeVisible();
  });

  test('happy path: valid submission navigates to confirmation page', async ({ page }) => {
    await page.goto(BUCHEN_URL);

    await page.getByLabel(/Vor- und Nachname/i).fill('Maria Muster');
    await page.getByLabel(/E-Mail-Adresse/i).fill('maria@example.de');
    await page.getByLabel(/Anliegen/i).selectOption('personalausweis');
    await page.getByLabel(/Datenschutz/i).check();

    await page.getByRole('button', { name: /Termin bestätigen/i }).click();

    await expect(page).toHaveURL(/eingegangen/);
  });

  test('confirmed booking appears on the eingegangen list page', async ({ page }) => {
    await page.goto(BUCHEN_URL);

    await page.getByLabel(/Vor- und Nachname/i).fill('Hans Huber');
    await page.getByLabel(/E-Mail-Adresse/i).fill('hans@example.de');
    await page.getByLabel(/Anliegen/i).selectOption('anabmeldung');
    await page.getByLabel(/Datenschutz/i).check();
    await page.getByRole('button', { name: /Termin bestätigen/i }).click();

    await expect(page).toHaveURL(/eingegangen/);
    await expect(page.getByText('Hans Huber')).toBeVisible();
  });

  test('booking persists in localStorage after successful submission', async ({ page }) => {
    await page.goto(BUCHEN_URL);

    await page.getByLabel(/Vor- und Nachname/i).fill('Greta Klein');
    await page.getByLabel(/E-Mail-Adresse/i).fill('greta@example.de');
    await page.getByLabel(/Anliegen/i).selectOption('fuehrungszeugnis');
    await page.getByLabel(/Datenschutz/i).check();
    await page.getByRole('button', { name: /Termin bestätigen/i }).click();

    await expect(page).toHaveURL(/eingegangen/);

    // Navigate away and back — booking should still be listed
    await page.goto('/blog-test/civic-portal/');
    await page.goto(EINGEGANGEN_URL);
    await expect(page.getByText('Greta Klein')).toBeVisible();
  });

  test('back button on booking form returns to the termin info page', async ({ page }) => {
    await page.goto(BUCHEN_URL);
    await page.getByRole('link', { name: /Zurück/i }).click();
    await expect(page).toHaveURL(/\/termin\//);
  });

  test('form input values persist when navigating back to the booking form', async ({ page }) => {
    await page.goto(BUCHEN_URL);

    await page.getByLabel(/Vor- und Nachname/i).fill('Test Person');
    await page.getByLabel(/E-Mail-Adresse/i).fill('test@example.de');

    // Navigate away and back
    await page.goto(TERMIN_URL);
    await page.goto(BUCHEN_URL);

    // Persisted draft values should be restored
    await expect(page.getByLabel(/Vor- und Nachname/i)).toHaveValue('Test Person');
    await expect(page.getByLabel(/E-Mail-Adresse/i)).toHaveValue('test@example.de');
  });

  test('eingegangen page has a link to book another appointment', async ({ page }) => {
    await page.goto(EINGEGANGEN_URL);
    await expect(
      page.getByRole('link', { name: /Neuen Termin buchen/i }),
    ).toBeVisible();
  });

  test('all booking service options are present in the Anliegen select', async ({ page }) => {
    await page.goto(BUCHEN_URL);
    const select = page.getByLabel(/Anliegen/i);
    await expect(select.locator('option[value="personalausweis"]')).toHaveCount(1);
    await expect(select.locator('option[value="anabmeldung"]')).toHaveCount(1);
    await expect(select.locator('option[value="fuehrungszeugnis"]')).toHaveCount(1);
    await expect(select.locator('option[value="sonstiges"]')).toHaveCount(1);
  });
});
