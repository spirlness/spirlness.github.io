import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { getPublicationLinks } from "../publication-links";
import { PublicationItem } from "@/components/publications/PublicationItem";
import { References } from "@/components/mdx/References";

describe("publication destinations", () => {
  it.each(["2401.01234", "2401.01234v2", "hep-th/9901001", "math.NA/0301001v3"])("expands arXiv identifier %s", arxiv => {
    expect(getPublicationLinks({ arxiv })).toEqual([{ kind: "arxiv", label: "arXiv", href: `https://arxiv.org/abs/${arxiv}` }]);
  });

  it("keeps absolute URLs and normalizes surrounding whitespace", () => {
    expect(getPublicationLinks({ arxiv: " https://arxiv.org/pdf/2401.01234 ", code: " https://github.com/example/repo " }).map(link => link.href))
      .toEqual(["https://github.com/example/repo", "https://arxiv.org/pdf/2401.01234"]);
  });

  it.each([undefined, "", " ", "javascript:alert(1)", "data:text/html,example", "//example.com/paper", "not-a-record"])("omits unsafe or invalid destinations: %s", value => {
    expect(getPublicationLinks({ url: value, pdf: value, code: value, arxiv: value })).toEqual([]);
  });

  it("both views use the same safe destinations while retaining their display order", () => {
    const pub = { id: "sample", type: "article", title: "Sample", authors: "Doe, Jane", year: "2024", url: "https://example.com/project", pdf: "https://example.com/paper.pdf", code: "javascript:alert(1)", arxiv: "2401.01234" };
    const publication = renderToStaticMarkup(createElement(PublicationItem, { pub, bibtex: "@article{sample}" }));
    const references = renderToStaticMarkup(createElement(References, { references: [pub] }));
    const hrefs = (html: string) => Array.from(html.matchAll(/href="([^"]+)"/g), match => match[1]);
    expect(hrefs(publication)).toEqual(["https://example.com/project", "https://example.com/paper.pdf", "https://arxiv.org/abs/2401.01234"]);
    expect(hrefs(references)).toEqual(["https://example.com/paper.pdf", "https://example.com/project", "https://arxiv.org/abs/2401.01234"]);
    expect(publication + references).not.toContain("javascript:");
  });
});
