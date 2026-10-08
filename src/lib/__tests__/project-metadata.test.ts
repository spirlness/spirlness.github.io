import { expect, it, vi } from "vitest";
import { compileContent } from "../mdx";
import { generateMetadata } from "../../app/projects/[id]/page";
import { generateMetadata as generatePostMetadata } from "../../app/blog/[slug]/page";

vi.mock("../mdx", () => ({
  compileContent: vi.fn(() => { throw new Error("Metadata must not compile the article body"); }),
}));

it("produces project metadata without compiling its MDX body", async () => {
  const metadata = await generateMetadata({ params: Promise.resolve({ id: "neural-symbolic-physics" }) });
  expect(metadata.title).toBe("Neural-Symbolic Physics");
  expect(metadata.description).toContain("conserved quantities");
  expect(compileContent).not.toHaveBeenCalled();
});


it("produces blog metadata without compiling its MDX body", async () => {
  const metadata = await generatePostMetadata({ params: Promise.resolve({ slug: "how-this-site-is-built" }) });
  expect(metadata.title).toBe("这个网站是如何构建的");
  expect(metadata.description).toContain("Next.js");
  expect(compileContent).not.toHaveBeenCalled();
});
