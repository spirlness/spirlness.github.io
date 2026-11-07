import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("article contents work by keyboard at mobile, tablet and desktop widths", async ({ page }) => {
  for (const width of [320, 390, 768, 1399, 1400, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/blog/how-this-site-is-built/");
    const toggle = page.getByRole("button", { name: "Contents", exact: true });
    const toc = page.locator('nav[aria-label="Table of contents"]');
    if (width < 1400) {
      await expect(toc).toBeHidden();
      await expect(toggle).toHaveAttribute("aria-expanded", "false");
      await page.keyboard.press("Tab");
      await toggle.focus();
      await page.keyboard.press("Space");
      await expect(toggle).toHaveAttribute("aria-expanded", "true");
      expect(await toggle.getAttribute("aria-controls")).toBe(await toc.getAttribute("id"));
    }
    await expect(toc).toBeVisible();
    const link = toc.locator('a[href="#内容即文件"]');
    await link.focus();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(new RegExp(encodeURIComponent("内容即文件") + "$"));
    const headerBottom = await page.locator("body > nav").evaluate(el => el.getBoundingClientRect().bottom);
    await expect.poll(() => page.locator('[id="内容即文件"]').evaluate(el => el.getBoundingClientRect().top)).toBeGreaterThanOrEqual(headerBottom);
    await expect(page.locator('[id="内容即文件"]')).toBeInViewport();
    await expect(link).toHaveAttribute("aria-current", "location");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBe(true);
    if (width < 1400) {
      await expect(toc).toBeHidden();
      await expect(toggle).toHaveAttribute("aria-expanded", "false");
      await expect(page.locator('[id="内容即文件"]')).toBeFocused();
      await toggle.focus();
      await page.keyboard.press("Space");
      await expect(toc).toBeVisible();
      await page.keyboard.press("Space");
      await expect(toc).toBeHidden();
      await expect(toggle).toBeFocused();
    } else {
      await expect(toc).toBeVisible();
      // Desktop keeps native fragment-focus behavior; only the disclosure state is controlled.
    }
  }
});

test("toc selection collapses on touch or click, including the current hash", async ({ page, isMobile }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/blog/how-this-site-is-built/");
  const toggle = page.getByRole("button", { name: "Contents", exact: true });
  const toc = page.getByRole("navigation", { name: "Table of contents" });
  // The second selection exercises an unchanged hash and still must move focus.
  for (let selection = 0; selection < 2; selection++) {
    await toggle.click();
    const link = toc.getByRole("link", { name: "内容即文件", exact: true });
    if (isMobile) await link.tap();
    else await link.click();
    await expect(page).toHaveURL(new RegExp(encodeURIComponent("内容即文件") + "$"));
    await expect(toc).toBeHidden();
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await expect(page.locator('[id="内容即文件"]')).toBeFocused();
  }
});

test("modified toc links keep the original disclosure open", async ({ page, context }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/blog/how-this-site-is-built/");
  const toggle = page.getByRole("button", { name: "Contents", exact: true });
  const toc = page.getByRole("navigation", { name: "Table of contents" });
  await toggle.click();
  const newTab = context.waitForEvent("page");
  await toc.getByRole("link", { name: "内容即文件", exact: true }).click({ modifiers: ["ControlOrMeta"] });
  const opened = await newTab;
  await opened.close();
  await expect(toc).toBeVisible();
  await expect(toggle).toHaveAttribute("aria-expanded", "true");
  await expect(page).toHaveURL(/\/blog\/how-this-site-is-built\/$/);
});

test("code copying is discoverable on touch and announces success", async ({ page, isMobile }) => {
  await page.goto("/blog/how-this-site-is-built/");
  const pre = page.locator("pre").first();
  const wrapper = pre.locator("..");
  const copy = wrapper.getByRole("button", { name: "Copy code", exact: true });
  await expect(copy).toHaveCSS("opacity", "1");
  if (isMobile) {
    await expect(copy).toHaveCSS("opacity", "1");
    const bounds = await copy.boundingBox();
    expect(bounds!.width).toBeGreaterThanOrEqual(44);
    expect(bounds!.height).toBeGreaterThanOrEqual(44);
    expect(await pre.locator("code").evaluate(el => el.getBoundingClientRect().top)).toBeGreaterThanOrEqual(bounds!.y + bounds!.height);
    await copy.tap();
  } else {
    await page.keyboard.press("Tab");
    await copy.focus();
    await expect(copy).toHaveCSS("opacity", "1");
    await page.keyboard.press("Enter");
  }
  await expect(wrapper.getByRole("status")).toHaveText("Code copied to clipboard");
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(await pre.locator("code").textContent());
});

test("copy failures explain recovery and remain retryable", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: async () => { throw new Error("Permission denied"); } } });
  });
  await page.goto("/blog/how-this-site-is-built/");
  const code = page.locator("pre").first().locator("..");
  await code.getByRole("button", { name: "Copy code", exact: true }).click();
  await expect(code.getByRole("status")).toContainText("Copy failed. Select the code");
  expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze()).violations).toEqual([]);
  await page.goto("/publications/");
  await page.getByRole("button", { name: "BibTeX", exact: true }).first().click();
  const dialog = page.getByRole("dialog");
  const copy = dialog.getByRole("button", { name: "Copy BibTeX citation to clipboard", exact: true });
  await copy.click();
  await expect(dialog.getByRole("status")).toContainText("Copy failed. Select the citation");
  expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze()).violations).toEqual([]);
  await page.evaluate(() => { navigator.clipboard.writeText = async () => {}; });
  await copy.click();
  await expect(dialog.getByRole("status")).toHaveText("BibTeX citation copied to clipboard");
});

test("closing a pending citation copy invalidates its stale completion", async ({ page }) => {
  await page.addInitScript(() => {
    const state = window as typeof window & { resolveWrites: Array<() => void> };
    state.resolveWrites = [];
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: () => new Promise<void>(resolve => state.resolveWrites.push(resolve)) } });
  });
  await page.goto("/publications/");
  const trigger = page.getByRole("button", { name: "BibTeX", exact: true }).first();
  await trigger.click();
  const dialog = page.getByRole("dialog");
  const copy = dialog.getByRole("button", { name: "Copy BibTeX citation to clipboard", exact: true });
  await copy.click();
  await expect(copy).toBeDisabled();
  await expect(copy).toHaveAttribute("aria-busy", "true");
  await dialog.getByRole("button", { name: "Close BibTeX dialog" }).click();
  await trigger.click();
  await expect(copy).toBeEnabled();
  await expect(dialog.getByRole("status")).toBeEmpty();
  await copy.click();
  await page.evaluate(() => (window as typeof window & { resolveWrites: Array<() => void> }).resolveWrites[0]());
  await expect(copy).toBeDisabled();
  await expect(dialog.getByRole("status")).toBeEmpty();
  await page.evaluate(() => (window as typeof window & { resolveWrites: Array<() => void> }).resolveWrites[1]());
  await expect(dialog.getByRole("status")).toHaveText("BibTeX citation copied to clipboard");
});

test("a fresh copy gets its full feedback interval", async ({ page }) => {
  await page.clock.install();
  await page.goto("/publications/");
  await page.getByRole("button", { name: "BibTeX", exact: true }).first().click();
  const dialog = page.getByRole("dialog");
  const status = dialog.getByRole("status");
  await dialog.getByRole("button", { name: "Copy BibTeX citation to clipboard", exact: true }).click();
  await expect(status).toHaveText("BibTeX citation copied to clipboard");
  await page.clock.fastForward(1200);
  await dialog.getByRole("button", { name: "BibTeX citation copied to clipboard", exact: true }).click();
  await expect(dialog.getByRole("button", { name: "BibTeX citation copied to clipboard", exact: true })).toBeEnabled();
  await page.clock.fastForward(1200);
  await expect(status).toHaveText("BibTeX citation copied to clipboard");
  await page.clock.fastForward(800);
  await expect(status).toBeEmpty();
});
