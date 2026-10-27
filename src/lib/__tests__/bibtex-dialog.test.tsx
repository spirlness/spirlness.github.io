import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@radix-ui/react-dialog", async () => {
  const actual = await vi.importActual<typeof import("@radix-ui/react-dialog")>("@radix-ui/react-dialog");
  return {
    ...actual,
    Portal: ({ children }: { children: React.ReactNode }) => children,
  };
});

import BibTeXDialog from "@/components/publications/BibTeXDialog";

describe("BibTeXDialog accessibility", () => {
  it("renders accessible close button with X icon and aria-label", () => {
    const html = renderToStaticMarkup(
      createElement(BibTeXDialog, {
        bibtex: "@article{example, title={Example}}",
        onClose: vi.fn(),
        restoreFocus: vi.fn(),
      })
    );

    expect(html).toContain('aria-label="Close BibTeX dialog"');
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain("min-h-11 min-w-11");
  });
});
