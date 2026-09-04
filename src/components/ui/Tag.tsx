import type { ReactNode } from "react";
import { SmartLink } from "./SmartLink";

export function Tag({
  children,
  href,
  variant = "project",
}: {
  children: ReactNode;
  href?: string;
  variant?: "project" | "filter" | "muted";
}) {
  const className =
    variant === "muted"
      ? "text-xs font-mono text-gray-400"
      : variant === "filter"
        ? "text-xs font-mono px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 hover:bg-orange-50"
        : "text-xs font-display font-medium text-orange-600 bg-orange-50 px-2.5 py-1 rounded-full";

  return href ? (
    <SmartLink
      href={href}
      className={`${className} hover:text-accent transition-colors`}
    >
      {children}
    </SmartLink>
  ) : (
    <span className={className}>{children}</span>
  );
}
