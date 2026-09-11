"use client";

import { useEffect, useState } from "react";
import type { TocHeading } from "@/lib/posts";

/**
 * Distill-style floating table of contents for the left gutter of
 * `.distill-grid`. Gated at the same `min-[1400px]:` breakpoint as SideNote:
 * below it the gutter is too narrow for a readable column and the aside would
 * overflow, so the nav is hidden entirely rather than clipped.
 *
 * Active-section tracking is position-based rather than IntersectionObserver's
 * `isIntersecting`: an observer only fires while a heading sits inside a narrow
 * band of the viewport, so a short final section (which scrolls past the band
 * before the page bottom) never activates, and neither do the leading sections
 * before the first one reaches the band. Comparing each heading's top against
 * one threshold line has neither dead zone.
 */
const ACTIVE_LINE_RATIO = 0.2;

export function TableOfContents({ headings }: { headings: TocHeading[] }) {
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    if (headings.length === 0) return;

    let frame = 0;
    const updateActive = () => {
      frame = 0;
      const line = window.innerHeight * ACTIVE_LINE_RATIO;
      let next: string | null = headings[0].id;
      for (const heading of headings) {
        const el = document.getElementById(heading.id);
        if (el && el.getBoundingClientRect().top <= line) next = heading.id;
      }
      setActiveId(next);
    };

    const onScroll = () => {
      // Coalesce scroll events into one measurement per frame.
      if (frame === 0) frame = requestAnimationFrame(updateActive);
    };

    updateActive();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [headings]);

  if (headings.length === 0) return null;

  return (
    <nav
      aria-label="Table of contents"
      className="hidden min-[1400px]:block sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto"
    >
      <p className="text-xs font-display font-bold tracking-widest text-gray-400 uppercase mb-3">
        Contents
      </p>
      <ul className="space-y-0.5 border-l border-gray-100">
        {headings.map((heading) => {
          const active = activeId === heading.id;
          return (
            <li key={heading.id}>
              <a
                href={`#${heading.id}`}
                aria-current={active ? "location" : undefined}
                className={`block text-sm leading-snug py-1 border-l-2 -ml-px pl-3 transition-colors ${
                  heading.level === 3 ? "pl-6" : ""
                } ${
                  active
                    ? "border-accent text-accent"
                    : "border-transparent text-gray-400 hover:text-gray-600"
                }`}
              >
                {heading.text}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
