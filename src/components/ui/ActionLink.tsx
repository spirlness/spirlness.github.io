import type { ReactNode } from "react";
import { SmartLink } from "./SmartLink";

export function ActionLink({
  href,
  icon,
  children,
  className = "",
}: {
  href: string;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <SmartLink
      href={href}
      className={`inline-flex items-center gap-1 text-sm font-medium text-orange-600 hover:text-orange-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded ${className}`}
    >
      {icon}
      {children}
    </SmartLink>
  );
}
