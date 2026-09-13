import { expect, test } from "@playwright/test";

test.describe("metadata bytes (S3 regression)", () => {
  test("feed serves RSS 2.0 with correct content type", async ({
    request,
  }) => {
    const r = await request.get("/feed.xml");
    expect(r.status()).toBe(200);
    expect(r.headers()["content-type"]).toContain("xml");
    const xml = await r.text();
    expect(xml).toContain('<rss version="2.0"');
    expect(xml).toContain("<pubDate>");
  });

  test("sitemap lists trailing-slash pages and tag routes", async ({
    request,
  }) => {
    const r = await request.get("/sitemap.xml");
    expect(r.status()).toBe(200);
    const xml = await r.text();
    expect(xml).toContain("https://spirlness.github.io/blog/");
    expect(xml).toContain("/blog/tag/physics/");
  });

  test("robots allows and points at sitemap", async ({ request }) => {
    const r = await request.get("/robots.txt");
    expect(r.status()).toBe(200);
    const txt = await r.text();
    expect(txt).toContain("Allow: /");
    expect(txt).toContain("Sitemap:");
  });
});

test.describe("SmartLink contract (S3 regression)", () => {
  test("internal hrefs normalize to trailing slash", async ({ page }) => {
    await page.goto("/");
    const hrefs = await page.evaluate(() =>
      [...document.querySelectorAll('a[href^="/"]')].map((a) =>
        a.getAttribute("href")
      )
    );
    expect(hrefs.length).toBeGreaterThan(0);
    for (const href of hrefs) {
      const path = href!.split(/[?#]/)[0];
      const isFile = /\/[^/]+\.[^/]+$/.test(path);
      expect(
        isFile || path.endsWith("/"),
        `href ${href} lacks trailing slash`
      ).toBe(true);
    }
  });

  test("external links carry noopener", async ({ page }) => {
    await page.goto("/");
    const rels = await page.evaluate(() =>
      [...document.querySelectorAll('a[target="_blank"]')].map(
        (a) => a.getAttribute("rel") ?? ""
      )
    );
    for (const rel of rels) {
      expect(rel).toContain("noopener");
    }
  });
});

test.describe("CodeBlock copy (S3)", () => {
  test("hover reveals copy button and click copies", async ({ page }) => {
    await page.goto("/blog/how-this-site-is-built/");
    const pre = page.locator("pre").first();
    if ((await pre.count()) === 0) {
      test.skip(true, "no code blocks on fixture post");
    }
    await pre.hover();
    const btn = page.getByRole("button", { name: /copy code/i }).first();
    await expect(btn).toBeVisible();
    await btn.click();
    const clip = await page.evaluate(() => navigator.clipboard.readText());
    expect(clip.length).toBeGreaterThan(0);
  });
});
