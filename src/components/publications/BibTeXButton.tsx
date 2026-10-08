"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useState } from "react";
import { Check, Quote } from "lucide-react";
import { useClipboard } from "@/hooks/useClipboard";

interface BibTeXButtonProps {
  bibtex: string;
}

export function BibTeXButton({ bibtex }: BibTeXButtonProps) {
  const [open, setOpen] = useState(false);
  const { status, copy, reset } = useClipboard();
  const copied = status === "copied";

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) reset();
      }}
    >
      <Dialog.Trigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-1 text-sm font-medium text-orange-700 hover:text-orange-800 transition-colors rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1"
        >
          <Quote size={14} />
          <span>BibTeX</span>
        </button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40" />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl border border-gray-100 p-6 shadow-none grid grid-rows-[auto_minmax(0,1fr)_auto] max-h-[calc(100dvh-2rem)]"
        >
          <Dialog.Description className="sr-only">
            Copy the BibTeX citation for this publication.
          </Dialog.Description>
          <div className="flex items-center justify-between mb-4">
            <Dialog.Title className="font-display text-lg font-bold text-gray-900">
              BibTeX
            </Dialog.Title>
            <Dialog.Close asChild>
              <button
                type="button"
                className="text-sm text-gray-600 hover:text-gray-700 rounded p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                aria-label="Close BibTeX dialog"
              >
                Close
              </button>
            </Dialog.Close>
          </div>
          <pre tabIndex={0} role="region" aria-label="BibTeX citation" className="bg-gray-900 text-gray-100 text-xs font-mono p-4 rounded-lg min-h-0 overflow-auto mb-4 whitespace-pre-wrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
            {bibtex}
          </pre>
          <div>
            <button
              type="button"
              onClick={() => copy(bibtex)}
              disabled={status === "copying"}
              aria-busy={status === "copying"}
              aria-label={
                copied
                  ? "BibTeX citation copied to clipboard"
                  : "Copy BibTeX citation to clipboard"
              }
              title={copied ? "Copied!" : "Copy BibTeX to clipboard"}
              className="inline-flex items-center gap-2 text-sm font-medium text-white bg-accent px-4 py-2 rounded-lg hover:bg-accent-hover transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
            >
              {copied ? (
                <>
                  <Check size={14} />
                  <span>Copied</span>
                </>
              ) : (
                "Copy to clipboard"
              )}
            </button>
            <span role="status" className={status === "error" ? "block text-sm text-orange-800 mt-2" : "sr-only"}>
              {status === "error" ? "Copy failed. Select the citation and copy it manually, or try again." : copied ? "BibTeX citation copied to clipboard" : ""}
            </span>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
