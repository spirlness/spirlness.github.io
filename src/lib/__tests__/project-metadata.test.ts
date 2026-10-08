import { expect, it, vi } from "vitest";
import { compileContent } from "../mdx";
import { generateMetadata } from "../../app/projects/[id]/page";

vi.mock("../mdx", () => ({
  compileContent: vi.fn(() => { throw new Error("Metadata must not compile the article body"); }),
}));

it("produces project metadata without compiling its MDX body", async () => {
  const metadata = await generateMetadata({ params: Promise.resolve({ id: "neural-symbolic-physics" }) });
  expect(metadata.title).toBe("Neural-Symbolic Physics");
  expect(metadata.description).toContain("conserved quantities");
  expect(compileContent).not.toHaveBeenCalled();
});
