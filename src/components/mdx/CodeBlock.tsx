"use client";

import { useRef, useState } from "react";
import { Check, Copy } from "lucide-react";

/**
 * Client wrapper for fenced code blocks: renders the styled <pre> unchanged
 * and adds a hover-revealed copy button. `className` carries the shiki token
 * classes plus the dark-block utilities from the MDXComponents `pre` override.
 */
export function CodeBlock({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLPreElement>) {
  const preRef = useRef<HTMLPreElement>(null);
  const [copied, setCopied] = useState(false);

  async function copy() {
    const text = preRef.current?.innerText ?? "";
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="relative group min-w-0 max-w-full">
      <button
        type="button"
        onClick={copy}
        aria-label={copied ? "Code copied to clipboard" : "Copy code"}
        title={copied ? "Copied!" : "Copy code"}
        className="absolute top-2 right-2 z-10 inline-flex items-center gap-1.5 rounded-md p-1.5 text-xs text-gray-400 hover:text-white hover:bg-gray-700/80 transition-colors opacity-0 group-hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
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
      <pre ref={preRef} className={className} {...props}>
        {children}
      </pre>
    </div>
  );
}
