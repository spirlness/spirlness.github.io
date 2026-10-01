import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { describe, expect, it } from "vitest";
import { PublicationItem } from "@/components/publications/PublicationItem";

describe("publication author highlighting", () => {
  it.each(["Li, Fuying", "Fuying Li", "Li Fuying", "{F}uying   Li"])(
    "highlights the configured author in %s form without highlighting coauthors",
    (authors) => {
      const html = renderToStaticMarkup(createElement(PublicationItem, {
        pub: { id: "example", type: "article", title: "Example", authors: `${authors} and Doe, Jane`, year: "2024" },
        bibtex: "@article{example}",
      }));
      expect(html.match(/<strong\b/g)).toHaveLength(1);
      expect(html).toContain(`>${authors}</strong>`);
      expect(html).not.toContain(">Doe, Jane</strong>");
    },
  );
});
