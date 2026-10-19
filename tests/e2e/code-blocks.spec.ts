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
    const block = pre.locator("..");
    await expect(block.getByText("Shell", { exact: true })).toBeVisible();
    const button = block.getByRole("button", { name: "Copy code", exact: true });
    await expect(button).toBeVisible();
    expect((await button.boundingBox())!.height).toBeGreaterThanOrEqual(44);
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
        const buttonBounds = (await button.boundingBox())!;
        expect(buttonBounds.x).toBeGreaterThanOrEqual(0);
        expect(buttonBounds.x + buttonBounds.width).toBeLessThanOrEqual(width + 1);
        await pre.evaluate((element) => { element.scrollLeft = 0; });
      }
    }
  });
}

test("copy failure supports keyboard retry", async ({ page }) => {
  await page.addInitScript(() => {
    let calls = 0;
    Object.defineProperty(navigator.clipboard, "writeText", {
      configurable: true,
      value: async () => {
        if (++calls === 1) throw new Error("Clipboard unavailable");
      },
    });
  });
  await page.goto("/blog/how-this-site-is-built/");
  const block = page.locator("[data-code-block]").first();
  const button = block.getByRole("button", { name: "Copy code", exact: true });
  await page.keyboard.press("Tab");
  await button.focus();
  await page.keyboard.press("Enter");
  await expect(button).toHaveText("Retry");
  await expect(button).toBeFocused();
  await expect(block.getByRole("status")).toBeVisible();
  await expect(block.getByRole("status")).toContainText("Copy failed");
  await page.keyboard.press("Enter");
  await expect(button).toHaveText("Copied");
  await expect(button).toBeFocused();
  await expect(block.getByRole("status")).toHaveText("Code copied to clipboard");
});

test("pending copying retains focus and ignores repeated activation", async ({ page }) => {
  await page.addInitScript(() => {
    const state = window as typeof window & { copyCalls: number; finishCopy: () => void };
    state.copyCalls = 0;
    Object.defineProperty(navigator.clipboard, "writeText", {
      configurable: true,
      value: () => {
        state.copyCalls++;
        return new Promise<void>((resolve) => { state.finishCopy = resolve; });
      },
    });
  });
  await page.goto("/blog/how-this-site-is-built/");
  const button = page.locator("[data-code-block]").first().getByRole("button", { name: "Copy code", exact: true });
  await button.focus();
  await page.keyboard.press("Enter");
  await expect(button).toHaveAttribute("aria-disabled", "true");
  await expect(button).toBeFocused();
  await page.keyboard.press("Enter");
  expect(await page.evaluate(() => (window as typeof window & { copyCalls: number }).copyCalls)).toBe(1);
  await page.evaluate(() => (window as typeof window & { finishCopy: () => void }).finishCopy());
  await expect(button).toHaveText("Copied");
  await expect(button).toHaveAttribute("aria-disabled", "false");
});
