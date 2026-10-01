import { expect, test } from "@playwright/test";

for (const width of [320, 390, 768, 1440]) {
  test(`long fenced code stays scrollable inside the article at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/blog/how-this-site-is-built/");
    const pre = page.locator('pre[data-language="bash"]').first();
    await expect(pre).toBeVisible();
    const code = pre.locator("code");
    await expect(code).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
    await expect(code).toHaveCSS("padding", "0px");
    await expect(pre).toHaveCSS("overflow-x", "auto");
    await expect(page.locator('p code').first()).not.toHaveCSS("background-color", "rgba(0, 0, 0, 0)");

    // Use the screenshot's actual publishing commands, then an exceptionally
    // long line to verify that code scrolls without widening the article.
    for (const extendLine of [false, true]) {
      if (extendLine) await code.evaluate((element) => {
        element.append(document.createTextNode("\n" + "long_token_".repeat(100)));
      });
      const dimensions = await pre.evaluate((element) => ({
        left: element.getBoundingClientRect().left,
        right: element.getBoundingClientRect().right,
        scrollWidth: element.scrollWidth,
        clientWidth: element.clientWidth,
        pageWidth: document.documentElement.scrollWidth,
        viewport: document.documentElement.clientWidth,
      }));
      expect(dimensions.left).toBeGreaterThanOrEqual(0);
      expect(dimensions.right).toBeLessThanOrEqual(width + 1);
      expect(dimensions.pageWidth).toBeLessThanOrEqual(dimensions.viewport + 1);
      if (width <= 390 || extendLine) {
        expect(dimensions.scrollWidth).toBeGreaterThan(dimensions.clientWidth);
        await pre.evaluate((element) => { element.scrollLeft = element.scrollWidth; });
        expect(await pre.evaluate((element) => element.scrollLeft)).toBeGreaterThan(0);
        await pre.evaluate((element) => { element.scrollLeft = 0; });
      }
    }
  });
}
