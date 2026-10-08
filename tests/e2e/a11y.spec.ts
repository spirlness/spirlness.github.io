import { expect, test } from "@playwright/test";

const ROUTES = [
  "/",
  "/blog/",
  "/projects/",
  "/publications/",
  "/blog/algorithmic-resilience/",
  "/projects/neural-symbolic-physics/",
];

test("blog cards reveal read-more and highlight the title on keyboard focus", async ({ page }) => {
  await page.goto("/blog/");
  const card = page.locator("main article").first();
  const link = card.getByRole("link");
  const title = card.getByRole("heading", { level: 2 });
  const prompt = card.getByText("READ MORE");
  const originalColor = await title.evaluate(el => getComputedStyle(el).color);
  await expect(prompt).toHaveCSS("opacity", "0");

  await page.keyboard.press("Tab");
  await link.focus();
  await expect(link).toBeFocused();
  await expect(link).not.toHaveCSS("box-shadow", "none");
  await expect(title).not.toHaveCSS("color", originalColor);
  await expect(prompt).toHaveCSS("opacity", "1");
  await expect(link).not.toHaveAccessibleName(/→/);
});

for (const route of ["/blog/algorithmic-resilience/", "/blog/how-this-site-is-built/"]) {
  test(`adjacent post titles respond to keyboard focus on ${route}`, async ({ page }) => {
    await page.goto(route);
    const link = page.locator("footer").getByRole("link").first();
    const title = link.locator("span.font-medium");
    const originalColor = await title.evaluate(el => getComputedStyle(el).color);
    await page.keyboard.press("Tab");
    await link.focus();
    await expect(link).toBeFocused();
    await expect(title).not.toHaveCSS("color", originalColor);
  });
}

test("project action links show a keyboard focus ring", async ({ page }) => {
  await page.goto("/projects/neural-symbolic-physics/");
  const codeLink = page.getByRole("link", { name: "Code", exact: true });
  for (let tabs = 0; tabs < 20; tabs++) {
    await page.keyboard.press("Tab");
    if (await codeLink.evaluate((link) => link === document.activeElement)) break;
  }
  await expect(codeLink).toBeFocused();
  await expect(codeLink).not.toHaveCSS("box-shadow", "none");
});

test.describe("skip link (S3)", () => {
  for (const width of [360, 1400]) {
    test(`Tab lands on skip link and activates to #main-content @ ${width}px`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 800 });
      await page.goto("/");
      const skip = page.getByRole("link", { name: /skip to (main )?content/i });
      await expect(skip).toBeAttached();
      await page.keyboard.press("Tab");
      await expect(skip).toBeFocused();
      await page.keyboard.press("Enter");
      await expect(page.locator("#main-content")).toBeFocused();
    });
  }

  test("every route exposes a #main-content landmark", async ({ page }) => {
    for (const route of ROUTES) {
      await page.goto(route);
      await expect(page.locator("#main-content")).toBeAttached();
    }
  });
});

test.describe("project media (S3)", () => {
  // The whole list card is one link, so its video must stay non-interactive
  // (controls nested in an anchor hijack activation); playback controls belong
  // to the detail page, which is not anchor-wrapped.
  test("card video is non-interactive and the detail video has controls", async ({
    page,
  }) => {
    await page.goto("/projects/");
    const cardVideo = page.locator("video").first();
    if ((await cardVideo.count()) === 0) {
      test.skip(true, "no video project fixture in content/");
    }
    await expect(cardVideo).not.toHaveAttribute("controls", "");
    await expect(cardVideo).not.toHaveAttribute("autoplay", "");

    const href = await cardVideo
      .locator("xpath=ancestor::a[1]")
      .getAttribute("href");
    expect(href).toBeTruthy();
    await page.goto(href!);
    const detailVideo = page.locator("video").first();
    await expect(detailVideo).toHaveAttribute("controls", "");
    await expect(detailVideo).not.toHaveAttribute("autoplay", "");
  });
});

test.describe("reduced motion (S3)", () => {
  test("kill-switch collapses CSS transitions", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/projects/");
    const duration = await page.evaluate(
      () =>
        getComputedStyle(document.querySelector("a.group")!).transitionDuration
    );
    expect(["0.01ms", "1e-05s"]).toContain(duration);
  });

  test("physics demo freezes a static frame", async ({ page }) => {
    const externalRequests: string[] = [];
    const pageErrors: string[] = [];
    await page.route("**/*", async (route) => {
      const url = new URL(route.request().url());
      if (url.origin !== "http://127.0.0.1:3000") {
        externalRequests.push(url.href);
        await route.abort();
      } else {
        await route.continue();
      }
    });
    page.on("pageerror", (error) => pageErrors.push(error.message));
    await page.emulateMedia({ reducedMotion: "reduce" });
    const environmentLoaded = page.waitForResponse((response) =>
      new URL(response.url()).pathname === "/environments/potsdamer_platz_1k.hdr"
    );
    await page.goto("/blog/algorithmic-resilience/");
    await page.getByRole("button", { name: "Start simulation", exact: true }).click();
    expect((await environmentLoaded).status()).toBe(200);
    await expect(page.getByRole("button", { name: "Pause simulation", exact: true })).toBeVisible({ timeout: 30000 });
    const canvas = page.locator("canvas").first();
    await expect(canvas).toBeVisible();
    const hasGL = await page.evaluate(() => {
      const c = document.querySelector("canvas");
      return !!c && !!(c.getContext("webgl2") || c.getContext("webgl"));
    });
    if (!hasGL) {
      test.skip(true, "WebGL unavailable in this Chromium");
    }
    await page.waitForTimeout(4000);
    const shot1 = await canvas.screenshot();
    await page.waitForTimeout(1200);
    const shot2 = await canvas.screenshot();
    expect(shot2.equals(shot1)).toBe(true);
    expect(externalRequests).toEqual([]);
    expect(pageErrors).toEqual([]);
  });
});
