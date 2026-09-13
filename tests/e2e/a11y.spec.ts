import { expect, test } from "@playwright/test";

const ROUTES = [
  "/",
  "/blog/",
  "/projects/",
  "/publications/",
  "/blog/algorithmic-resilience/",
  "/projects/neural-symbolic-physics/",
];

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
  test("video has controls and does not autoplay", async ({ page }) => {
    await page.goto("/projects/");
    const video = page.locator("video").first();
    if ((await video.count()) === 0) {
      test.skip(true, "no video project fixture in content/");
    }
    await expect(video).toHaveAttribute("controls", "");
    await expect(video).not.toHaveAttribute("autoplay", "");
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
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/blog/algorithmic-resilience/");
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
  });
});
