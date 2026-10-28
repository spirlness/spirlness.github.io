import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { SimulationErrorBoundary } from "@/components/interactive/SimulationErrorBoundary";

describe("SimulationErrorBoundary", () => {
  it("renders children when no error occurs", () => {
    const html = renderToStaticMarkup(
      <SimulationErrorBoundary onRetry={() => {}}>
        <div>Simulation Running</div>
      </SimulationErrorBoundary>
    );

    expect(html).toContain("Simulation Running");
  });

  it("returns failed state from getDerivedStateFromError", () => {
    const derived = SimulationErrorBoundary.getDerivedStateFromError();
    expect(derived).toEqual({ failed: true });
  });

  it("renders accessible fallback UI when failed state is set", () => {
    const boundary = new SimulationErrorBoundary({
      children: <div>Simulation Running</div>,
      onRetry: vi.fn(),
    });
    boundary.state = { failed: true };

    const html = renderToStaticMarkup(boundary.render());

    expect(html).toContain("The interactive preview could not load");
    expect(html).toContain("Try again");
    expect(html).toContain("min-h-11");
    expect(html).toContain("touch-manipulation");
    expect(html).toContain("focus-visible:ring-2");
    expect(html).toContain("focus-visible:ring-accent");
  });
});
