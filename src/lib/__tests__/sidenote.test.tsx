import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import SideNote from "@/components/mdx/SideNote";

describe("SideNote component", () => {
  it("renders collapsible details/summary and wide aside element", () => {
    const html = renderToStaticMarkup(
      <SideNote label="Clarification">This is a side note content.</SideNote>
    );

    expect(html).toContain("<details");
    expect(html).toContain("<summary");
    expect(html).toContain("<span>Clarification</span>");
    expect(html).toContain("This is a side note content.");
    expect(html).toContain("<aside");
    expect(html).toContain("focus-visible:ring-accent");
    expect(html).toContain("focus-visible:ring-offset-2");
  });

  it("uses default label 'Note' when label is not provided", () => {
    const html = renderToStaticMarkup(
      <SideNote>Default note content</SideNote>
    );

    expect(html).toContain("<span>Note</span>");
  });
});
