import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import Navbar from "@/components/layout/Navbar";

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
}));

describe("Navbar accessibility", () => {
  it("renders nav landmark with aria-label='Main navigation'", () => {
    const html = renderToStaticMarkup(
      <Navbar
        navTitle="Test Site"
        navLinks={[
          { href: "/", label: "Home" },
          { href: "/projects", label: "Projects" },
        ]}
      />
    );

    expect(html).toContain('aria-label="Main navigation"');
    expect(html).toContain("Test Site");
    expect(html).toContain("Home");
    expect(html).toContain("Projects");
  });
});
