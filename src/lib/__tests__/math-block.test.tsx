import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { MathBlock } from "@/components/mdx/MathBlock";

describe("MathBlock accessibility", () => {
  it("renders with tabIndex={0}, role='region', and default aria-label", () => {
    const html = renderToStaticMarkup(<MathBlock equation="E = mc^2" />);
    expect(html).toContain('tabindex="0"');
    expect(html).toContain('role="region"');
    expect(html).toContain('aria-label="Mathematical equation"');
    expect(html).toContain("katex");
  });

  it("includes equation label in aria-label when provided", () => {
    const html = renderToStaticMarkup(<MathBlock equation="a^2 + b^2 = c^2" label="1" />);
    expect(html).toContain('tabindex="0"');
    expect(html).toContain('role="region"');
    expect(html).toContain('aria-label="Mathematical equation (1)"');
    expect(html).toContain("(1)");
  });
});
