import { expect, test, type Page } from "@playwright/test";

async function expectNoHorizontalOverflow(page: Page) {
  const dimensions = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: Math.max(
      document.documentElement.scrollWidth,
      document.body?.scrollWidth ?? 0
    ),
  }));

  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth + 1);
}

async function expectPath(page: Page, pathname: string) {
  await expect.poll(() => new URL(page.url()).pathname).toBe(pathname);
}

test.describe("academic site pages", () => {
  test("renders the home page and navigates primary sections", async ({ page }) => {
    const response = await page.goto("/");
    expect(response?.status()).toBe(200);
    await expect(page).toHaveTitle(/Li Fuying/);
    await expect(
      page.getByRole("heading", { level: 1 })
    ).toContainText("Physics, Intelligence");
    await expectNoHorizontalOverflow(page);

    const sections = [
      ["PROJECTS", "/projects/", "Projects"],
      ["PUBLICATIONS", "/publications/", "Publications"],
      ["BLOG", "/blog/", "Blog"],
      ["HOME", "/", "Physics, Intelligence"],
    ] as const;

    for (const [label, pathname, heading] of sections) {
      await page.getByRole("navigation").first().getByRole("link", { name: label, exact: true }).click();
      await expectPath(page, pathname);
      await expect(page.getByRole("heading", { level: 1 })).toContainText(heading);
      await expectNoHorizontalOverflow(page);
    }
  });

  test("browses blog tags and the article experience", async ({ page }) => {
    await page.goto("/blog/");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Blog");
    const tags = page.getByRole("navigation", { name: "Tags" });
    await expect(tags.getByRole("link", { name: /#physics/ })).toBeVisible();
    await tags.getByRole("link", { name: /#physics/ }).click();
    await expectPath(page, "/blog/tag/physics/");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("#physics");
    await expect(page.getByRole("heading", { level: 2, name: /Algorithmic Resilience/ })).toBeVisible();

    await page.getByRole("link", { name: /Algorithmic Resilience in Neural Physical Systems/ }).click();
    await expectPath(page, "/blog/algorithmic-resilience/");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "Algorithmic Resilience in Neural Physical Systems"
    );
    await expect(page.getByText(/\d+ min read/)).toBeVisible();
    await expect(page.getByRole("heading", { level: 2, name: "References" })).toBeVisible();
    await expectNoHorizontalOverflow(page);

    const toc = page.getByRole("navigation", { name: "Table of contents" });
    const noteButton = page.getByRole("button", { name: "Note" });
    const isWide = await page.evaluate(() => window.innerWidth >= 1400);

    if (isWide) {
      await expect(toc).toBeVisible();
      await expect(page.locator("aside").getByText(/Algorithmic Resilience is defined here/)).toBeVisible();
      await expect(noteButton).toBeHidden();
    } else {
      await expect(toc).toBeHidden();
      await expect(noteButton).toBeVisible();
      const inlineNote = noteButton.locator("xpath=..");
      await expect(inlineNote.getByText(/Algorithmic Resilience is defined here/)).toBeHidden();
      await noteButton.click();
      await expect(inlineNote.getByText(/Algorithmic Resilience is defined here/)).toBeVisible();
    }
  });

  test("opens a project detail page and follows internal links", async ({ page }) => {
    await page.goto("/projects/");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Projects");
    await page.getByRole("link", { name: /Neural-Symbolic Physics/ }).click();
    await expectPath(page, "/projects/neural-symbolic-physics/");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Neural-Symbolic Physics");
    await expect(page.getByRole("img", { name: "Neural-Symbolic Physics" })).toBeVisible();
    await expect(page.getByText("Deep Learning", { exact: true })).toBeVisible();

    const codeLink = page.getByRole("link", { name: "Code", exact: true });
    await expect(codeLink).toHaveAttribute("href", "https://github.com/spirlness");
    await expect(codeLink).toHaveAttribute("target", "_blank");
    await expect(codeLink).toHaveAttribute("rel", /noopener/);

    await page.getByRole("link", { name: "Paper", exact: true }).click();
    await expectPath(page, "/publications/");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Publications");
  });

  test("uses the BibTeX dialog and clipboard interaction", async ({ page }) => {
    await page.goto("/publications/");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Publications");
    const publication = page
      .getByRole("heading", { level: 3, name: "Deep Learning for Physics Simulation" })
      .locator("..");
    const bibtexButton = publication.getByRole("button", { name: "BibTeX", exact: true });
    await expect(bibtexButton).toBeVisible();

    await bibtexButton.click();
    const dialog = page.getByRole("dialog", { name: "BibTeX" });
    await expect(dialog).toBeVisible();
    await expect(dialog.locator("pre")).toContainText("@article{li2024deep");
    const closeButton = dialog.getByRole("button", { name: "Close", exact: true });
    await expect(closeButton).toBeFocused();

    const copyButton = dialog.getByRole("button", { name: "Copy to clipboard", exact: true });
    await copyButton.click();
    await expect(dialog.getByRole("button", { name: "Copied", exact: true })).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(bibtexButton).toBeFocused();
  });

  test("renders the custom 404 page and returns home", async ({ page }) => {
    const response = await page.goto("/does-not-exist/");
    expect(response?.status()).toBe(404);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Page not found");
    await page.getByRole("link", { name: /Back to Li Fuying/ }).click();
    await expectPath(page, "/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Physics, Intelligence");
  });
});
