import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import Home from "@/app/page";

vi.mock("@/lib/updates", () => ({
  getAllUpdates: () => [
    { date: "2026-10", content: "External update", link: "https://example.com/update", icon: "publication" },
    { date: "2026-09", content: "Internal update", link: "/projects/", icon: "publication" },
  ],
}));

describe("home update links", () => {
  it("renders one decorative external indicator and preserves the new-tab description", () => {
    const html = renderToStaticMarkup(<Home />);
    const link = html.match(/<a\b[^>]*href="https:\/\/example\.com\/update"[^>]*>[\s\S]*?<\/a>/)?.[0];
    expect(link).toBeDefined();
    expect(link!.match(/lucide-external-link/g)).toHaveLength(1);
    expect(link).toMatch(/<svg[^>]*aria-hidden="true"/);
    expect(link).toContain('target="_blank"');
    expect(link).toContain('rel="noopener noreferrer"');
    const descriptionId = /aria-describedby="([^"]+)"/.exec(link!)?.[1];
    expect(descriptionId).toBeDefined();
    expect(link).toContain(`<span id="${descriptionId}" hidden="">Opens in a new tab.</span>`);
    expect(link).toContain("External update");

    const internal = html.match(/<a\b[^>]*>[\s\S]*?<\/a>/g)?.find(anchor => anchor.includes("Internal update"));
    expect(internal).toBeDefined();
    expect(internal).not.toContain("lucide-external-link");
    expect(internal).not.toContain('target="_blank"');
  });
});
