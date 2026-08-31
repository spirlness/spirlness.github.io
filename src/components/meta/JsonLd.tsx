/**
 * Inline JSON-LD structured data. Renders as a <script type="application/ld+json">.
 * `<` is escaped so a title containing "</script>" cannot break out of the block.
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}
