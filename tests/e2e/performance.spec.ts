import { expect, test } from "@playwright/test";

test("side notes remain keyboard operable without JavaScript", async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  try {
    const page = await context.newPage();
    await page.goto(`${baseURL}/blog/algorithmic-resilience/`);
    const note = page.locator("details").first();
    const trigger = note.locator("summary");
    const content = note.getByText(/Algorithmic Resilience is defined here/);
    await expect(content).toBeHidden();
    await trigger.focus();
    await page.keyboard.press("Enter");
    await expect(content).toBeVisible();
    await page.keyboard.press("Space");
    await expect(content).toBeHidden();
    await page.setViewportSize({ width: 1440, height: 900 });
    await expect(note).toBeHidden();
    await expect(page.locator("aside").getByText(/Algorithmic Resilience is defined here/)).toBeVisible();
  } finally {
    await context.close();
  }
});

test("math CSS is deferred until article navigation and equations remain styled", async ({ page }) => {
  await page.goto("/");
  const hasMathFonts = () => page.evaluate(() => Array.from(document.styleSheets).some(sheet =>
    Array.from(sheet.cssRules).some(rule => rule.cssText.includes("KaTeX_Main"))
  ));
  expect(await hasMathFonts()).toBe(false);
  await page.getByRole("link", { name: "BLOG", exact: true }).click();
  await page.getByRole("link", { name: /Algorithmic Resilience in Neural Physical Systems/ }).click();
  await expect(page.locator(".katex").first()).toBeVisible();
  await expect.poll(hasMathFonts).toBe(true);
  await expect(page.locator(".katex").first()).toHaveCSS("font-family", /KaTeX_Main/);
});
