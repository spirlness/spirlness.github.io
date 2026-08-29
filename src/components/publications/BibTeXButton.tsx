"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Quote } from "lucide-react";

interface BibTeXButtonProps {
  bibtex: string;
}

export function BibTeXButton({ bibtex }: BibTeXButtonProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const dialog = dialogRef.current;
    if (!dialog) return;

    const focusable = () =>
      Array.from(
        dialog.querySelectorAll<HTMLButtonElement>(
          'button:not([disabled])'
        )
      );

    const closeButton = focusable()[0];
    closeButton?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        return;
      }

      if (event.key !== "Tab") return;

      const elements = focusable();
      const first = elements[0];
      const last = elements[elements.length - 1];
      if (!first || !last) return;

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      triggerRef.current?.focus();
    };
  }, [open]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(bibtex);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1 text-sm font-medium text-orange-600 hover:text-orange-700 transition-colors"
      >
        <Quote size={14} />
        <span>BibTeX</span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
          role="dialog"
          aria-modal="true"
          aria-labelledby="bibtex-dialog-title"
          onClick={() => setOpen(false)}
        >
          <div
            ref={dialogRef}
            className="w-full max-w-lg bg-white rounded-xl border border-gray-100 p-6 shadow-none"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 id="bibtex-dialog-title" className="font-display text-lg font-bold text-gray-900">
                BibTeX
              </h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-sm text-gray-400 hover:text-gray-700"
              >
                Close
              </button>
            </div>
            <pre className="bg-gray-900 text-gray-100 text-xs font-mono p-4 rounded-lg overflow-x-auto mb-4 whitespace-pre-wrap">
              {bibtex}
            </pre>
            <button
              type="button"
              onClick={copy}
              className="inline-flex items-center gap-2 text-sm font-medium text-white bg-accent px-4 py-2 rounded-lg hover:opacity-90 transition-opacity"
            >
              {copied ? (
                <>
                  <Check size={14} />
                  Copied
                </>
              ) : (
                "Copy to clipboard"
              )}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
