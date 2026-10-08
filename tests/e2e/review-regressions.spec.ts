import AxeBuilder from "@axe-core/playwright";
import { chromium, expect, test } from "@playwright/test";

const routes = ["/", "/blog/", "/projects/", "/publications/", "/blog/how-this-site-is-built/", "/blog/algorithmic-resilience/", "/projects/neural-symbolic-physics/", "/projects/algorithmic-resilience-benchmark/", "/blog/tag/web/"];
const article = "/blog/algorithmic-resilience/";

for (const route of routes) {
  test(`accessible structure and contrast on ${route}`, async ({ page }) => {
    await page.goto(route);
    await expect(page.getByRole("main")).toHaveCount(1);
    const audit = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "best-practice"]).analyze();
    expect(audit.violations).toEqual([]);
  });
}

test("Chinese articles declare their content language", async ({ page }) => {
  await page.goto("/blog/how-this-site-is-built/");
  await expect(page.locator("main article")).toHaveAttribute("lang", "zh");
});

test("fragment navigation leaves headings below the sticky header", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/blog/how-this-site-is-built/#" + encodeURIComponent("内容即文件"));
  await page.evaluate(() => document.fonts.ready);
  const navBottom = await page.locator("body > nav").evaluate(el => el.getBoundingClientRect().bottom);
  const target = page.locator('[id="内容即文件"]');
  await expect.poll(() => target.evaluate(el => el.getBoundingClientRect().top)).toBeGreaterThanOrEqual(navBottom);
  const toc = page.getByRole("navigation", { name: "Table of contents" });
  for (const link of await toc.getByRole("link").all()) {
    const href = await link.getAttribute("href");
    await link.click();
    await expect.poll(() => page.locator(`[id="${decodeURIComponent(href!.slice(1))}"]`).evaluate(el => el.getBoundingClientRect().top)).toBeGreaterThanOrEqual(navBottom);
  }
});

test("long citations keep close and copy controls within a small viewport", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto("/publications/");
  await page.getByRole("button", { name: "BibTeX", exact: true }).first().click();
  const dialog = page.getByRole("dialog");
  await dialog.locator("pre").evaluate(el => { el.textContent = el.textContent!.replace("Li, Fuying and Zhang, San and Wang, Wu", Array(30).fill("Lastname, Firstname").join(" and ")); });
  const dimensions = await dialog.evaluate(el => ({ top: el.getBoundingClientRect().top, bottom: el.getBoundingClientRect().bottom, height: innerHeight }));
  expect(dimensions.top).toBeGreaterThanOrEqual(0);
  expect(dimensions.bottom).toBeLessThanOrEqual(dimensions.height);
  await expect(dialog.getByRole("button", { name: "Close BibTeX dialog" })).toBeInViewport();
  await expect(dialog.getByRole("button", { name: "Copy BibTeX citation to clipboard" })).toBeInViewport();
  expect(await dialog.locator("pre").evaluate(el => el.scrollHeight > el.clientHeight)).toBe(true);
});

test("the scene is downloaded only when started and stops drawing when paused, hidden or offscreen", async ({ page, isMobile }) => {
  test.setTimeout(90000);
  await page.addInitScript(() => {
    const state = window as typeof window & { simulationDraws: number };
    state.simulationDraws = 0;
    for (const method of ["drawElements", "drawArrays", "drawElementsInstanced", "drawArraysInstanced"] as const) {
      const original = WebGL2RenderingContext.prototype[method];
      Object.defineProperty(WebGL2RenderingContext.prototype, method, { configurable: true, writable: true, value: function (this: WebGL2RenderingContext, ...args: unknown[]) {
        state.simulationDraws++;
        return Reflect.apply(original, this, args);
      } });
    }
  });
  const environmentRequests: string[] = [];
  page.on("request", r => { if (r.url().endsWith(".hdr")) environmentRequests.push(r.url()); });
  await page.goto(article);
  await expect(page.getByRole("button", { name: "Start simulation" })).toBeAttached();
  expect(environmentRequests).toEqual([]);
  await expect(page.locator("canvas")).toHaveCount(0);
  await page.getByRole("button", { name: "Start simulation" }).click();
  const pause = page.getByRole("button", { name: "Pause simulation", exact: true });
  await expect(pause).toBeVisible({ timeout: 30000 });
  expect(environmentRequests).toHaveLength(1);
  const draws = () => page.evaluate(() => (window as typeof window & { simulationDraws: number }).simulationDraws);
  const expectDrawingToStop = async () => {
    // Let already queued GPU work finish, then require two quiet intervals.
    await expect.poll(async () => {
      const before = await draws();
      await page.waitForTimeout(1000);
      return (await draws()) - before;
    }, { timeout: 10000 }).toBe(0);
    const settled = await draws();
    await page.waitForTimeout(1000);
    expect(await draws()).toBe(settled);
    return settled;
  };
  await expect.poll(draws).toBeGreaterThan(0);
  if (isMobile) await pause.tap();
  else await pause.click();
  const pausedDraws = await expectDrawingToStop();
  const resume = page.getByRole("button", { name: "Resume simulation", exact: true });
  if (isMobile) await resume.tap();
  else await resume.click();
  await expect.poll(draws).toBeGreaterThan(pausedDraws);
  await page.evaluate(() => {
    Object.defineProperty(document, "visibilityState", { configurable: true, value: "hidden" });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  const hiddenDraws = await expectDrawingToStop();
  await page.evaluate(() => {
    Object.defineProperty(document, "visibilityState", { configurable: true, value: "visible" });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect.poll(draws).toBeGreaterThan(hiddenDraws);
  await page.evaluate(() => window.scrollTo(0, 0));
  await expect.poll(() => page.locator('[aria-label="Interactive simulation"]').evaluate(el => el.getBoundingClientRect().top >= innerHeight)).toBe(true);
  await expectDrawingToStop();
});

test("failed environment requests are contained and can be retried", async ({ page }) => {
  test.setTimeout(90000);
  await page.route("**/*.hdr", route => route.abort());
  await page.goto(article);
  await page.getByRole("button", { name: "Start simulation" }).click();
  await expect(page.getByText("The interactive preview could not load.", { exact: false })).toBeVisible({ timeout: 30000 });
  await expect(page.getByRole("main")).toBeVisible();
  await expect(page.getByRole("heading", { name: "References", exact: true })).toBeAttached();
  await expect(page.getByText("This page couldn’t load")).toHaveCount(0);
  await page.unroute("**/*.hdr");
  await page.getByRole("button", { name: "Try again", exact: true }).click();
  await expect(page.getByRole("button", { name: "Pause simulation", exact: true })).toBeVisible({ timeout: 30000 });
});

test("the article remains readable without WebGL", async ({ baseURL }) => {
  const browser = await chromium.launch({ args: ["--disable-webgl"] });
  try {
    const page = await browser.newPage();
    await page.goto(baseURL + article);
    await page.getByRole("button", { name: "Start simulation" }).click();
    await expect(page.getByText("Your browser does not support this interactive preview.", { exact: false })).toBeVisible({ timeout: 30000 });
    await expect(page.getByRole("heading", { name: "References", exact: true })).toBeAttached();
    await expect(page.getByRole("navigation").first()).toBeVisible();
  } finally {
    await browser.close();
  }
});

test("unverified records do not publish misleading destinations or scholarly metadata", async ({ page }) => {
  await page.goto("/publications/");
  await expect(page.getByText("Publication details awaiting verification.", { exact: true })).toHaveCount(3);
  await expect(page.locator('a[href*="2401.00001"], a[href*="2305.00002"], a[href*="physics-sim"], a[href*="s41467-023-00001-x"]')).toHaveCount(0);
  const structuredData = await page.locator('script[type="application/ld+json"]').allTextContents();
  expect(structuredData.join(" ")).not.toContain('"@type":"ScholarlyArticle"');
});
