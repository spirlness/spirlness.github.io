import Link from "next/link";
import type { AnchorHTMLAttributes, ReactNode } from "react";
import {
  isExternalHref,
  isSafeHref,
  normalizeInternalHref,
} from "@/lib/links";

interface SmartLinkProps
  extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> {
  href: string;
  children: ReactNode;
}

export function SmartLink({ href, children, ...props }: SmartLinkProps) {
  if (!isSafeHref(href)) {
    return <span className={props.className}>{children}</span>;
  }

  if (isExternalHref(href)) {
    return (
      <a href={href} {...props} target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    );
  }

  if (href.startsWith("#")) {
    return (
      <a href={href} {...props}>
        {children}
      </a>
    );
  }

  return (
    <Link href={normalizeInternalHref(href)} {...props}>
      {children}
    </Link>
  );
}
