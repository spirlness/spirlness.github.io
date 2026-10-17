import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import Navbar from "@/components/layout/Navbar";

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
}));

describe("Navbar accessibility", () => {
  it("renders primary navigation landmark with aria-label", () => {
    const navLinks = [
      { href: "/", label: "HOME" },
      { href: "/projects/", label: "PROJECTS" },
      { href: "/blog/", label: "BLOG" },
    ];
    const html = renderToStaticMarkup(<Navbar navTitle="Li Fuying" navLinks={navLinks} />);
    expect(html).toContain('aria-label="Primary"');
    expect(html).toContain('aria-current="page"');
    expect(html).toContain("PROJECTS");
    expect(html).toContain("BLOG");
  });
});
