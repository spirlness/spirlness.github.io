"use client";

import { useEffect, useState } from "react";
import type { TocHeading } from "@/lib/posts";

/**
 * Distill-style floating table of contents for the left gutter of
 * `.distill-grid`. Gated at the same `min-[1400px]:` breakpoint as SideNote:
 * below it the gutter is too narrow for a readable column and the aside would
 * overflow, so the nav is hidden entirely rather than clipped.
 */
export function TableOfContents({ headings }: { headings: TocHeading[] }) {
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    if (headings.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        }
      },
      { rootMargin: "-15% 0px -75% 0px", threshold: 0 }
    );

    for (const heading of headings) {
      const el = document.getElementById(heading.id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
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
        {headings.map((heading) => (
          <li key={heading.id}>
            <a
              href={`#${heading.id}`}
              className={`block text-sm leading-snug py-1 border-l-2 -ml-px pl-3 transition-colors ${
                heading.level === 3 ? "pl-6" : ""
              } ${
                activeId === heading.id
                  ? "border-accent text-accent"
                  : "border-transparent text-gray-400 hover:text-gray-600"
              }`}
            >
              {heading.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
