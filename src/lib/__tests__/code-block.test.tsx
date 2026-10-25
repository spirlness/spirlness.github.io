import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { CodeBlock } from "@/components/mdx/CodeBlock";

describe("CodeBlock region naming", () => {
  it.each([
    ["python", "Python code"],
    ["bash", "Shell code"],
    [undefined, "Plain text code"],
  ])("names the focusable %s region", (language, name) => {
    const html = renderToStaticMarkup(<CodeBlock data-language={language}><code>example</code></CodeBlock>);
    expect(html).toMatch(/<pre[^>]*role="region"/);
    expect(html).toContain(`aria-label="${name}"`);
    expect(html).toContain('tabindex="0"');
  });

  it("preserves a caller's descriptive label and focus policy", () => {
    const html = renderToStaticMarkup(
      <CodeBlock data-language="python" aria-label="Training example" tabIndex={-1}><code>example</code></CodeBlock>,
    );
    expect(html).toMatch(/<pre[^>]*role="region"/);
    expect(html).toContain('aria-label="Training example"');
    expect(html).toContain('tabindex="-1"');
  });
});
