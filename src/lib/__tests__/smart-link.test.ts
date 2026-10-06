import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { describe, expect, it } from "vitest";
import { SmartLink } from "@/components/ui/SmartLink";

describe("SmartLink accessibility", () => {
  it("appends sr-only text for external links without explicit aria-label", () => {
    const html = renderToStaticMarkup(
      createElement(SmartLink, { href: "https://example.com" }, "External Site")
    );
    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noopener noreferrer"');
    expect(html).toContain(
      '<span class="sr-only"> (opens in a new tab)</span>'
    );
    expect(html).toContain("External Site");
  });

  it("updates aria-label for external links when aria-label is provided", () => {
    const html = renderToStaticMarkup(
      createElement(
        SmartLink,
        { href: "https://example.com", "aria-label": "Example Site" },
        "Link Text"
      )
    );
    expect(html).toContain('aria-label="Example Site (opens in a new tab)"');
    expect(html).not.toContain('<span class="sr-only">');
  });

  it("does not append new tab text for internal links", () => {
    const html = renderToStaticMarkup(
      createElement(SmartLink, { href: "/projects" }, "Projects")
    );
    expect(html).not.toContain("opens in a new tab");
    expect(html).not.toContain('target="_blank"');
  });

  it("does not append new tab text for hash links", () => {
    const html = renderToStaticMarkup(
      createElement(SmartLink, { href: "#section" }, "Section")
    );
    expect(html).not.toContain("opens in a new tab");
    expect(html).not.toContain('target="_blank"');
  });

  it("renders a span for unsafe hrefs", () => {
    const html = renderToStaticMarkup(
      createElement(SmartLink, { href: "javascript:alert(1)" }, "Unsafe Link")
    );
    expect(html).toContain("<span");
    expect(html).not.toContain("<a");
  });
});
