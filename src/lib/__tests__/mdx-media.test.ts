import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { compileContent } from "../mdx";

describe("MDX audio media", () => {
  it("renders an audio player with a safe child source and no parent src", async () => {
    const { content } = await compileContent({
      source: '<audio controls><source src="/recordings/talk.mp3" type="audio/mpeg" /></audio>',
      slug: "audio-source",
    });

    const html = renderToStaticMarkup(content);
    expect(html).toContain("<audio controls=\"\">");
    expect(html).toContain('src="/recordings/talk.mp3"');
  });

  it("rejects a declared unsafe audio src even when its child is safe", async () => {
    const { content } = await compileContent({
      source:
        '<audio src="data:audio/mpeg;base64,AAAA" controls><source src="/recordings/talk.mp3" /></audio>',
      slug: "unsafe-audio",
    });

    const html = renderToStaticMarkup(content);
    expect(html).not.toContain("<audio");
    expect(html).not.toContain("<source");
  });

  it("keeps an audio player with a safe parent src", async () => {
    const { content } = await compileContent({
      source: '<audio src="/recordings/talk.mp3" controls />',
      slug: "direct-audio",
    });

    expect(renderToStaticMarkup(content)).toContain('src="/recordings/talk.mp3"');
  });

  it.each([
    "<audio controls />",
    '<audio controls><source src="javascript:alert(1)" /></audio>',
    '<audio controls><source src="/recordings/talk.mp3" srcSet="javascript:alert(1) 1x" /></audio>',
  ])("does not render an audio player without a usable source: %s", async (source) => {
    const { content } = await compileContent({ source, slug: "empty-audio" });

    expect(renderToStaticMarkup(content)).not.toContain("<audio");
  });

  it("rejects unsafe child sources without dropping the safe player", async () => {
    const { content } = await compileContent({
      source: '<audio controls><source src="javascript:alert(1)" /><source src="/recordings/talk.mp3" /></audio>',
      slug: "mixed-audio-sources",
    });

    const html = renderToStaticMarkup(content);
    expect(html).toContain("<audio");
    expect(html).not.toContain("javascript:");
    expect(html).toContain('src="/recordings/talk.mp3"');
  });
});

describe("MDX responsive images", () => {
  it("keeps a valid URL containing a comma in an image srcSet", async () => {
    const { content } = await compileContent({
      source:
        '<img src="/img/fallback.png" srcSet="https://cdn.example.com/image/upload/w_800,q_auto/a.jpg 1x, /img/a@2x.png 2x" alt="Photo" />',
      slug: "image-commas",
    });

    const html = renderToStaticMarkup(content);
    expect(html).toContain('<img src="/img/fallback.png"');
    expect(html).toContain('w_800,q_auto/a.jpg 1x');
  });

  it.each([
    '<img src="/img/fallback.png" srcSet="/img/a.png 1x, javascript:alert(1) 2x" alt="Photo" />',
    '<img src="/img/fallback.png" srcset="/img/a.png 1x, data:image/png;base64,AAAA 2x" alt="Photo" />',
    '<img src="data:image/png;base64,AAAA" alt="Photo" />',
  ])("removes images with an unsafe loading target: %s", async (source) => {
    const { content } = await compileContent({ source, slug: "image-unsafe" });

    expect(renderToStaticMarkup(content)).not.toContain("<img");
  });

  it("retains safe picture sources with URL commas", async () => {
    const { content } = await compileContent({
      source: '<picture><source srcSet="https://cdn.example.com/w_800,q_auto/a.jpg 1x, /img/a@2x.png 2x" /><img src="/img/a.png" alt="Photo" /></picture>',
      slug: "picture-commas",
    });

    const html = renderToStaticMarkup(content);
    expect(html).toContain("<picture>");
    expect(html).toContain("w_800,q_auto/a.jpg 1x");
    expect(html).toContain('src="/img/a.png"');
  });

  it("keeps valid video sources and a safe poster", async () => {
    const { content } = await compileContent({
      source: '<video controls poster="/img/preview.png"><source src="/recordings/demo.mp4" type="video/mp4" /></video>',
      slug: "video-source",
    });

    const html = renderToStaticMarkup(content);
    expect(html).toContain('poster="/img/preview.png"');
    expect(html).toContain('src="/recordings/demo.mp4"');
  });

  it.each([
    ['<iframe src="https://example.com" srcDoc="<script>bad</script>" />', "<iframe"],
    ['<object data="javascript:alert(1)" />', "<object"],
    ['<embed src="data:text/html,hello" />', "<embed"],
    ['<video poster="javascript:alert(1)" />', "<video"],
  ])("applies the media overrides to explicit JSX: %s", async (source, element) => {
    const { content } = await compileContent({ source, slug: "unsafe-media" });

    expect(renderToStaticMarkup(content)).not.toContain(element);
  });
});
