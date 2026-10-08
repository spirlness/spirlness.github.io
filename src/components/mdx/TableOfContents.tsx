"use client";

import { useEffect, useId, useState } from "react";
import type { TocHeading } from "@/lib/posts";

/**
 * Distill-style floating table of contents for the left gutter of
 * `.distill-grid`. Gated at the same `min-[1400px]:` breakpoint as SideNote:
 * below it the gutter is too narrow for a readable column and the aside would
 * overflow, so narrower layouts use a disclosure above the article. At the
 * breakpoint the nav is right-aligned in the left track at the same 240px
 * width as SideNote's gutter, so it hugs the article column instead of the
 * viewport edge.
 *
 * Active-section tracking is position-based rather than IntersectionObserver's
 * `isIntersecting`, whose narrow band never activates for the leading sections:
 * they sit above the band until the page scrolls. Instead each heading's top
 * is compared against one threshold line, plus an explicit clamp to the last
 * heading once the document is scrolled to its end — without that clamp a
 * short final section can never cross the line before scrolling stops.
 */
const ACTIVE_LINE_RATIO = 0.2;

export function TableOfContents({ headings }: { headings: TocHeading[] }) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const navigationId = useId();

  useEffect(() => {
    if (headings.length === 0) return;

    // Cache DOM element references on setup to avoid calling document.getElementById
    // N times on every frame during 60 FPS scroll updates.
    const headingElements = headings.map((heading) => ({
      id: heading.id,
      el: document.getElementById(heading.id),
    }));

    let frame = 0;
    const updateActive = () => {
      frame = 0;
      const line = window.innerHeight * ACTIVE_LINE_RATIO;
      let next: string | null = headings[0].id;
      for (const item of headingElements) {
        // Fall back to document.getElementById if element was not present at setup time
        if (!item.el?.isConnected) item.el = document.getElementById(item.id);
        const el = item.el;
        if (el && el.getBoundingClientRect().top <= line) next = item.id;
      }
      // End-of-document clamp: a short final section can bottom out below the
      // threshold line, so once the page cannot scroll further the last heading
      // must win. The 2px slack absorbs fractional scroll/zoom positions.
      const atDocumentEnd =
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 2;
      if (atDocumentEnd) next = headings[headings.length - 1].id;
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
    <div className="not-prose mb-6 min-[1400px]:mb-0 min-[1400px]:sticky min-[1400px]:top-24 min-[1400px]:ml-auto min-[1400px]:w-[240px]">
      <button type="button" lang="en" aria-expanded={expanded} aria-controls={navigationId} onClick={() => setExpanded(value => !value)} className="min-[1400px]:hidden inline-flex items-center justify-between gap-4 w-full rounded-md border border-gray-200 px-4 py-3 font-display text-sm text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
        Contents <span aria-hidden="true">{expanded ? "−" : "+"}</span>
      </button>
      <nav
        id={navigationId}
        aria-label="Table of contents"
        className={`${expanded ? "block" : "hidden"} min-[1400px]:block mt-3 min-[1400px]:mt-0 max-h-[50dvh] min-[1400px]:max-h-[calc(100dvh-8rem)] overflow-y-auto`}
      >
        <p lang="en" className="hidden min-[1400px]:block text-xs font-display font-bold tracking-widest text-gray-600 uppercase mb-3">
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
                  className={`block text-sm leading-snug py-1 border-l-2 -ml-px pl-3 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-r-sm ${
                    heading.level === 3 ? "pl-6" : ""
                  } ${
                    active
                      ? "border-accent text-accent"
                      : "border-transparent text-gray-600 hover:text-accent"
                  }`}
                >
                  {heading.text}
                </a>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
