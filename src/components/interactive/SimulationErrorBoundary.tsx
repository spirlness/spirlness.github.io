"use client";

import { Component, type ReactNode } from "react";

/** An optional preview must never replace the surrounding article on failure. */
export class SimulationErrorBoundary extends Component<{
  children: ReactNode;
  onRetry: () => void;
}, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (this.state.failed) {
      return (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center">
          <p role="status" className="text-gray-700">The interactive preview could not load. You can continue reading the article.</p>
          <button type="button" onClick={this.props.onRetry} className="rounded-md bg-accent px-4 py-2 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2">
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
