import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { EmptyState } from "@/components/ui/EmptyState";

describe("EmptyState component", () => {
  it("renders with status role for screen reader accessibility", () => {
    const html = renderToStaticMarkup(
      <EmptyState>No items found.</EmptyState>
    );
    expect(html).toContain('role="status"');
    expect(html).toContain("No items found.");
  });
});
