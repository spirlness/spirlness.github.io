import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { describe, expect, it } from "vitest";
import { BibTeXButton } from "@/components/publications/BibTeXButton";

describe("BibTeXButton accessibility", () => {
  it("renders trigger button with accessible attributes", () => {
    const html = renderToStaticMarkup(
      createElement(BibTeXButton, {
        bibtex: "@article{example, title={Test}}",
      })
    );
    expect(html).toContain("<span>BibTeX</span>");
    expect(html).toContain('aria-haspopup="dialog"');
  });
});
