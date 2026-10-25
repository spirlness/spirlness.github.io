"use client";

import { useRef } from "react";
import { AlertCircle, Check, Copy } from "lucide-react";
import { useClipboard } from "@/hooks/useClipboard";

interface CodeBlockProps extends React.HTMLAttributes<HTMLPreElement> {
  "data-language"?: string;
}

const languageLabels: Record<string, string> = {
  bash: "Shell", sh: "Shell", shell: "Shell", zsh: "Shell",
  js: "JavaScript", javascript: "JavaScript", jsx: "JSX",
  ts: "TypeScript", typescript: "TypeScript", tsx: "TSX",
  py: "Python", python: "Python", json: "JSON", css: "CSS",
  html: "HTML", sql: "SQL", yaml: "YAML", yml: "YAML",
  md: "Markdown", markdown: "Markdown", text: "Plain text", plaintext: "Plain text",
};

/** Shiki renders tokens at build time; this shell only handles interaction. */
export function CodeBlock({
  children,
  className = "",
  "data-language": language = "text",
  tabIndex = 0,
  ...props
}: CodeBlockProps) {
  const preRef = useRef<HTMLPreElement>(null);
  const copying = useRef(false);
  const { status, copy } = useClipboard();
  const copied = status === "copied";
  const key = language.toLowerCase();
  const label = Object.hasOwn(languageLabels, key) ? languageLabels[key] : language;

  async function copyCode() {
    // aria-disabled keeps keyboard focus; guard writes synchronously as well.
    if (copying.current) return;
    copying.current = true;
    const pre = preRef.current;
    try {
      await copy((pre?.querySelector("code") ?? pre)?.textContent ?? "");
    } finally {
      copying.current = false;
    }
  }

  return (
    <div data-code-block className="not-prose my-8 min-w-0 max-w-full overflow-hidden rounded-xl border border-gray-700 bg-[#0d1117] shadow-sm">
      <div lang="en" className="flex items-center justify-between gap-4 border-b border-gray-700 bg-gray-900 px-4 py-1.5">
        <span className="truncate font-mono text-xs font-medium text-gray-300">{label}</span>
        <button
          type="button"
          onClick={copyCode}
          aria-disabled={status === "copying"}
          aria-busy={status === "copying"}
          aria-label={
            copied
              ? "Code copied to clipboard"
              : status === "error"
                ? "Retry copying code"
                : status === "copying"
                  ? "Copying code…"
                  : "Copy code"
          }
          title={copied ? "Copied!" : "Copy code"}
          className="inline-flex min-h-11 min-w-24 shrink-0 items-center justify-center gap-2 rounded-md px-3 text-xs font-medium text-gray-300 transition-colors hover:bg-gray-700 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 aria-disabled:cursor-wait aria-disabled:opacity-60"
        >
          {copied ? <Check size={15} aria-hidden="true" />
            : status === "error" ? <AlertCircle size={15} aria-hidden="true" />
              : <Copy size={15} aria-hidden="true" />}
          <span>{copied ? "Copied" : status === "error" ? "Retry" : status === "copying" ? "Copying…" : "Copy"}</span>
        </button>
      </div>
      <pre
        {...props}
        ref={preRef}
        role="region"
        data-language={language}
        tabIndex={tabIndex}
        aria-label={props["aria-label"] ?? `${label} code`}
        className={`m-0 min-w-0 max-w-full overflow-x-auto bg-transparent p-4 font-mono text-[13px] leading-6 text-gray-100 [tab-size:2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-orange-400 ${className}`}
      >
        {children}
      </pre>
      <span role="status" lang="en" aria-atomic="true" className={status === "error" ? "block border-t border-gray-700 px-4 py-3 text-xs text-orange-300" : "sr-only"}>
        {status === "error" ? "Copy failed. Select the code and copy it manually, or try again." : copied ? "Code copied to clipboard" : ""}
      </span>
    </div>
  );
}
