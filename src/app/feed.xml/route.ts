import { siteProfile } from "@/content/site";
import { getAllPostFrontmatter, postHref } from "@/lib/posts";

export const dynamic = "force-static";

export function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function rssDate(date: string): string {
  const parsed = new Date(date);
  return Number.isNaN(parsed.getTime()) ? "" : parsed.toUTCString();
}

export function GET() {
  const base = siteProfile.url;
  const posts = getAllPostFrontmatter();

  const items = posts
    .map(
      (post) => `    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${base}${postHref(post.slug)}</link>
      <guid isPermaLink="true">${base}${postHref(post.slug)}</guid>
      <pubDate>${rssDate(post.date)}</pubDate>
      <description>${escapeXml(post.excerpt)}</description>
    </item>`
    )
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(siteProfile.title)}</title>
    <link>${base}/</link>
    <description>${escapeXml(siteProfile.description)}</description>
    <atom:link href="${base}/feed.xml" rel="self" type="application/rss+xml"/>
    <language>en</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
    },
  });
}
