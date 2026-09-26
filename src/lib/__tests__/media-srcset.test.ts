import { describe, expect, it } from "vitest";
import { isSafeSrcSet, parseSrcSet } from "../media-srcset";

describe("parseSrcSet", () => {
  it("extracts URLs and keeps descriptors out of the candidate list", () => {
    expect(parseSrcSet("/img/a.png 1x, /img/a@2x.png 2x")).toEqual([
      "/img/a.png",
      "/img/a@2x.png",
    ]);
    expect(parseSrcSet("/img/a.png 640w, /img/a.png 640w 480h")).toEqual([
      "/img/a.png",
      "/img/a.png",
    ]);
    expect(parseSrcSet("/img/a.png")).toEqual(["/img/a.png"]);
  });

  it("keeps commas inside URL tokens when parsing candidates", () => {
    expect(
      parseSrcSet(
        "https://cdn.example.com/image/upload/w_800,q_auto/a.jpg 1x, /img/a@2x.png 2x"
      )
    ).toEqual([
      "https://cdn.example.com/image/upload/w_800,q_auto/a.jpg",
      "/img/a@2x.png",
    ]);
    expect(parseSrcSet("/img/a,b.png")).toEqual(["/img/a,b.png"]);
    expect(parseSrcSet("/img/a,b.png 1x, /img/c.png 2x")).toEqual([
      "/img/a,b.png",
      "/img/c.png",
    ]);
  });

  it("tolerates surrounding and internal whitespace, including a trailing comma", () => {
    expect(parseSrcSet("  /a.png   1x ,\n\t/b.png\t2x ,  ")).toEqual([
      "/a.png",
      "/b.png",
    ]);
    expect(parseSrcSet("/a.png 1x,")).toEqual(["/a.png"]);
  });

  it("returns null when no candidate parses into a URL", () => {
    expect(parseSrcSet("")).toBeNull();
    expect(parseSrcSet("   ")).toBeNull();
    expect(parseSrcSet(",,,")).toBeNull();
    expect(parseSrcSet("/a.png bogus-descriptor")).toBeNull();
  });
});

describe("isSafeSrcSet", () => {
  it("accepts site-absolute and absolute http(s) candidates", () => {
    expect(isSafeSrcSet("/img/a.png 1x, /img/a@2x.png 2x")).toBe(true);
    expect(isSafeSrcSet("/img/a.png 640w")).toBe(true);
    expect(isSafeSrcSet("https://cdn.example.com/img/a.png 2x")).toBe(true);
    expect(isSafeSrcSet("/img/a.png 1x, https://cdn.example.com/img/a.png 2x")).toBe(
      true
    );
    expect(isSafeSrcSet("/a.png 1x,")).toBe(true);
    expect(
      isSafeSrcSet(
        "https://cdn.example.com/image/upload/w_800,q_auto/a.jpg 1x, /img/a@2x.png 2x"
      )
    ).toBe(true);
  });

  it("rejects unsafe schemes, protocol-relative URLs, and relative paths", () => {
    expect(isSafeSrcSet("javascript:alert(1) 1x")).toBe(false);
    expect(isSafeSrcSet("data:image/png;base64,AAAA 1x")).toBe(false);
    expect(isSafeSrcSet("//evil.example/a.png 1x")).toBe(false);
    expect(isSafeSrcSet("relative.png 1x")).toBe(false);
    expect(isSafeSrcSet("#anchor")).toBe(false);
    expect(isSafeSrcSet("2x")).toBe(false);
  });

  it("rejects loopback media hosts, which cannot resolve in a static export", () => {
    expect(isSafeSrcSet("http://localhost:3000/x.png 1x")).toBe(false);
    expect(isSafeSrcSet("http://127.0.0.1:3000/x.png 2x")).toBe(false);
    expect(isSafeSrcSet("http://[::1]:3000/x.png")).toBe(false);
    expect(isSafeSrcSet("http://preview.localhost/x.png 640w")).toBe(false);
  });

  it("rejects the whole list when any candidate is unsafe", () => {
    expect(isSafeSrcSet("/a.png 1x, javascript:alert(1) 2x")).toBe(false);
    expect(isSafeSrcSet("/a.png 1x, //evil.example/b.png 2x")).toBe(false);
    expect(isSafeSrcSet("/a.png 1x, http://localhost:3000/b.png 2x")).toBe(false);
    expect(isSafeSrcSet("/a.png 1x, relative.png 2x")).toBe(false);
    expect(isSafeSrcSet("/a.png 1x, data:image/png;base64,AAAA 2x")).toBe(false);
    expect(isSafeSrcSet("/a.png, javascript:alert(1) 2x")).toBe(false);
  });

  it("rejects empty and non-string values", () => {
    expect(isSafeSrcSet("")).toBe(false);
    expect(isSafeSrcSet("   ")).toBe(false);
    expect(isSafeSrcSet(",,")).toBe(false);
    expect(isSafeSrcSet(undefined)).toBe(false);
    expect(isSafeSrcSet(null)).toBe(false);
    expect(isSafeSrcSet(42)).toBe(false);
    expect(isSafeSrcSet({ srcSet: "/a.png" })).toBe(false);
  });
});
