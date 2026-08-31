import { describe, expect, it } from "vitest";
import { escapeXml, GET } from "./route";

describe("escapeXml", () => {
  it("makes RSS descriptions safe without relying on CDATA", () => {
    expect(escapeXml("A ]]> B & C < D")).toBe(
      "A ]]&gt; B &amp; C &lt; D"
    );
  });

  it("returns an XML RSS response with an explicit content type", async () => {
    const response = GET();

    expect(response.headers.get("Content-Type")).toBe(
      "application/rss+xml; charset=utf-8"
    );
    await expect(response.text()).resolves.toContain("<rss version=\"2.0\"");
  });
});
