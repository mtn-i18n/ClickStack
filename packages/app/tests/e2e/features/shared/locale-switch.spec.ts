import { expect, test } from '../../utils/base-test';

test.describe('Locale switching', { tag: ['@core'] }, () => {
  test('switches language and persists it across reloads', async ({ page }) => {
    await page.goto('/search');
    const searchNav = page.locator('[data-testid="nav-link-search"]');
    await expect(searchNav).toContainText('Search');

    const openPreferences = async () => {
      await page.locator('[data-testid="user-menu-trigger"]').click();
      await page.locator('[data-testid="user-preferences-menu-item"]').click();
    };

    const selectLocale = async (label: string) => {
      await page.locator('[data-testid="language-select"]').click();
      await page.getByRole('option', { name: label }).click();
    };

    await openPreferences();
    await selectLocale('简体中文');

    await expect(searchNav).toContainText('搜索');
    await expect(page.locator('html')).toHaveAttribute('lang', 'zh-CN');

    await page.reload();
    await expect(page.locator('[data-testid="nav-link-search"]')).toContainText(
      '搜索',
    );
    await expect(page.locator('html')).toHaveAttribute('lang', 'zh-CN');

    await openPreferences();
    await selectLocale('English');

    await expect(page.locator('[data-testid="nav-link-search"]')).toContainText(
      'Search',
    );
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  });
});
