"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useState } from "react";
import { Check, Quote } from "lucide-react";

interface BibTeXButtonProps {
  bibtex: string;
}

export function BibTeXButton({ bibtex }: BibTeXButtonProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

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
    <Dialog.Root
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) setCopied(false);
      }}
    >
      <Dialog.Trigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-1 text-sm font-medium text-orange-600 hover:text-orange-700 transition-colors"
        >
          <Quote size={14} />
          <span>BibTeX</span>
        </button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40" />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl border border-gray-100 p-6 shadow-none"
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
                className="text-sm text-gray-400 hover:text-gray-700"
              >
                Close
              </button>
            </Dialog.Close>
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
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
