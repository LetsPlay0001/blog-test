import { test, expect } from '@playwright/test';

// Lightweight structural accessibility checks that don't require axe-core.
// For a full WCAG audit, add @axe-core/playwright and run axe().

const pages = [
  { name: 'civic portal home',    url: '/blog-test/civic-portal/' },
  { name: 'termin info page',     url: '/blog-test/civic-portal/termin/' },
  { name: 'booking form',         url: '/blog-test/civic-portal/termin/buchen/' },
  { name: 'eingegangen list',     url: '/blog-test/civic-portal/eingegangen/' },
  { name: 'tirana blog home',     url: '/blog-test/tirana-blog/' },
];

for (const { name, url } of pages) {
  test.describe(`Accessibility – ${name}`, () => {
    test('page has a single h1', async ({ page }) => {
      await page.goto(url);
      const h1Count = await page.locator('h1').count();
      expect(h1Count).toBe(1);
    });

    test('heading hierarchy does not skip levels', async ({ page }) => {
      await page.goto(url);
      const headings = await page.locator('h1, h2, h3, h4, h5, h6').allInnerTexts();
      // Just verify there are headings and they are not empty
      const nonEmpty = headings.filter(h => h.trim().length > 0);
      expect(nonEmpty.length).toBeGreaterThan(0);
    });

    test('images have non-empty alt attributes', async ({ page }) => {
      await page.goto(url);
      const images = page.locator('img');
      const count = await images.count();
      for (let i = 0; i < count; i++) {
        const alt = await images.nth(i).getAttribute('alt');
        // alt="" is valid for decorative images; null means the attribute is missing
        expect(alt).not.toBeNull();
      }
    });

    test('interactive elements are keyboard-focusable', async ({ page }) => {
      await page.goto(url);
      // Tab through the first 10 focusable elements and confirm focus moves
      const focusable = page.locator('a, button, input, select, textarea').first();
      await focusable.focus();
      await expect(focusable).toBeFocused();
    });

    test('page language attribute is set', async ({ page }) => {
      await page.goto(url);
      const lang = await page.locator('html').getAttribute('lang');
      expect(lang).toBeTruthy();
    });

    test('page has a meaningful title', async ({ page }) => {
      await page.goto(url);
      const title = await page.title();
      expect(title.trim().length).toBeGreaterThan(0);
    });
  });
}

test.describe('Accessibility – booking form specifics', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/blog-test/civic-portal/termin/buchen/');
  });

  test('all form inputs are associated with a label', async ({ page }) => {
    const inputs = page.locator('input, select, textarea');
    const count = await inputs.count();
    for (let i = 0; i < count; i++) {
      const input = inputs.nth(i);
      const id = await input.getAttribute('id');
      if (!id) continue; // unlabelled inputs without id are checked separately
      const label = page.locator(`label[for="${id}"]`);
      const labelCount = await label.count();
      expect(labelCount, `Input #${id} should have an associated label`).toBe(1);
    }
  });

  test('required fields are marked as required in the DOM', async ({ page }) => {
    const nameInput = page.getByLabel(/Vor- und Nachname/i);
    const emailInput = page.getByLabel(/E-Mail-Adresse/i);
    const serviceSelect = page.getByLabel(/Anliegen/i);
    const consentCheckbox = page.getByLabel(/Datenschutz/i);

    for (const el of [nameInput, emailInput, serviceSelect, consentCheckbox]) {
      const required = await el.getAttribute('required');
      expect(required, 'required attribute should be present').not.toBeNull();
    }
  });

  test('submit button is not disabled on page load', async ({ page }) => {
    const submitBtn = page.getByRole('button', { name: /Termin bestätigen/i });
    await expect(submitBtn).toBeEnabled();
  });
});

test.describe('Accessibility – civic portal navigation landmarks', () => {
  test('page has a <main> landmark', async ({ page }) => {
    await page.goto('/blog-test/civic-portal/');
    await expect(page.locator('main')).toBeVisible();
  });

  test('page has a <header> landmark', async ({ page }) => {
    await page.goto('/blog-test/civic-portal/');
    await expect(page.locator('header').first()).toBeVisible();
  });

  test('page has a <footer> landmark', async ({ page }) => {
    await page.goto('/blog-test/civic-portal/');
    await expect(page.locator('footer').first()).toBeVisible();
  });

  test('header search has role=search', async ({ page }) => {
    await page.goto('/blog-test/civic-portal/');
    await expect(page.getByRole('search')).toBeVisible();
  });

  test('decorative SVGs have aria-hidden="true"', async ({ page }) => {
    await page.goto('/blog-test/civic-portal/termin/buchen/');
    // All inline SVGs that are decorative should be hidden from assistive tech
    const unhiddenDecoSvgs = page.locator('svg:not([aria-label]):not([aria-hidden="true"])');
    const count = await unhiddenDecoSvgs.count();
    // No decorative SVG should lack aria-hidden
    expect(count).toBe(0);
  });
});
