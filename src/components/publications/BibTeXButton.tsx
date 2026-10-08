"use client";

import { lazy, Suspense, useRef, useState } from "react";
import { Quote } from "lucide-react";

const BibTeXDialog = lazy(() => import("./BibTeXDialog"));

export function BibTeXButton({ bibtex }: { bibtex: string }) {
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);

  return (
    <>
      <button
        ref={trigger}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1 text-sm font-medium text-orange-700 hover:text-orange-800 transition-colors rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1"
      >
        <Quote size={14} />
        <span>BibTeX</span>
      </button>
      {open && (
        <Suspense fallback={<span role="status" className="sr-only">Loading citation dialog…</span>}>
          <BibTeXDialog bibtex={bibtex} onClose={() => setOpen(false)} restoreFocus={() => trigger.current?.focus()} />
        </Suspense>
      )}
    </>
  );
}
