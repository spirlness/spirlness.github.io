"use client";

import { useRef } from "react";
import { Check, Copy } from "lucide-react";
import { useClipboard } from "@/hooks/useClipboard";

/**
 * Client wrapper for fenced code blocks: renders the styled <pre> unchanged
 * and adds a copy button visible on touch or hover/focus. `className` carries the shiki token
 * classes plus the dark-block utilities from the MDXComponents `pre` override.
 */
export function CodeBlock({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLPreElement>) {
  const preRef = useRef<HTMLPreElement>(null);
  const { status, copy } = useClipboard();
  const copied = status === "copied";

  return (
    <div className="code-block relative group min-w-0 max-w-full">
      <button
        type="button"
        onClick={() => copy(preRef.current?.innerText ?? "")}
        disabled={status === "copying"}
        aria-busy={status === "copying"}
        lang="en"
        aria-label={copied ? "Code copied to clipboard" : "Copy code"}
        title={copied ? "Copied!" : "Copy code"}
        className="code-copy-button absolute top-2 right-2 z-10 inline-flex items-center justify-center gap-1.5 min-h-11 min-w-11 sm:min-h-8 sm:min-w-8 rounded-md p-1.5 text-xs text-gray-300 bg-gray-900 hover:text-white hover:bg-gray-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-wait"
      >
        {copied ? (
          <>
            <Check size={14} className="text-green-400" />
            <span className="text-green-400 font-medium text-xs">Copied!</span>
          </>
        ) : (
          <Copy size={14} />
        )}
      </button>
      <pre ref={preRef} className={className} {...props} tabIndex={props.tabIndex ?? 0}>
        {children}
      </pre>
      <span role="status" lang="en" className={status === "error" ? "block text-sm text-gray-700 mt-2" : "sr-only"}>
        {status === "error" ? "Copy failed. Select the code and copy it manually, or try again." : copied ? "Code copied to clipboard" : ""}
      </span>
    </div>
  );
}
