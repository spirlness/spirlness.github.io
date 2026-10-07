import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { SmartLink } from "@/components/ui/SmartLink";

function noticeId(html: string): string {
  const id = /<span id="([^"]+)" hidden="">Opens in a new tab\.<\/span>/.exec(html)?.[1];
  expect(id).toBeDefined();
  return id!;
}

describe("SmartLink external-link descriptions", () => {
  it("describes a new tab while retaining the original link text", () => {
    const html = renderToStaticMarkup(<SmartLink href="https://example.com">Code</SmartLink>);
    expect(html).toContain(`aria-describedby="${noticeId(html)}"`);
    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noopener noreferrer"');
    expect(html).not.toContain("aria-label=");
    expect(html).toContain(">Code<span");
  });

  it("preserves an explicit aria-label", () => {
    const html = renderToStaticMarkup(
      <SmartLink href="https://example.com" aria-label="Example Site">Link Text</SmartLink>,
    );
    expect(html).toContain('aria-label="Example Site"');
    expect(html).toContain(`aria-describedby="${noticeId(html)}"`);
  });

  it("describes the new tab when aria-labelledby supplies the link name", () => {
    const html = renderToStaticMarkup(
      <SmartLink href="https://example.com" aria-labelledby="site-name">Link Text</SmartLink>,
    );
    expect(html).toContain('aria-labelledby="site-name"');
    expect(html).toContain(`aria-describedby="${noticeId(html)}"`);
  });

  it("retains existing description references", () => {
    const html = renderToStaticMarkup(
      <SmartLink href="https://example.com" aria-describedby="existing-description">Site</SmartLink>,
    );
    expect(html).toContain(`aria-describedby="existing-description ${noticeId(html)}"`);
  });

  it("gives repeated external links distinct description IDs", () => {
    const html = renderToStaticMarkup(<>
      <SmartLink href="https://example.com">First</SmartLink>
      <SmartLink href="https://example.com">Second</SmartLink>
    </>);
    const ids = [...html.matchAll(/<span id="([^"]+)" hidden=""/g)].map(match => match[1]);
    expect(ids).toHaveLength(2);
    expect(new Set(ids).size).toBe(2);
  });

  it.each(["/projects", "#section"])("leaves internal link behavior unchanged for %s", href => {
    const html = renderToStaticMarkup(<SmartLink href={href}>Internal</SmartLink>);
    expect(html).not.toContain("Opens in a new tab");
    expect(html).not.toContain("aria-describedby=");
    expect(html).not.toContain('target="_blank"');
  });

  it("renders unsafe URLs as text", () => {
    const html = renderToStaticMarkup(<SmartLink href="javascript:alert(1)">Unsafe</SmartLink>);
    expect(html).toBe("<span>Unsafe</span>");
  });
});
