"use client";

import Link from "next/link";
import { useId, type AnchorHTMLAttributes, type ReactNode } from "react";
import {
  isExternalHref,
  isSafeHref,
  isSafeMailtoHref,
  normalizeInternalHref,
} from "@/lib/links";

interface SmartLinkProps
  extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> {
  href: string;
  children: ReactNode;
}

export function SmartLink({ href, children, ...props }: SmartLinkProps) {
  const newTabNoticeId = useId();
  href = href.trim();

  if (!isSafeHref(href)) {
    return <span className={props.className}>{children}</span>;
  }

  if (isExternalHref(href)) {
    return (
      <a
        href={href}
        {...props}
        aria-describedby={[props["aria-describedby"], newTabNoticeId].filter(Boolean).join(" ")}
        target="_blank"
        rel="noopener noreferrer"
      >
        {children}
        {/* Referenced hidden text describes the action without changing the link name. */}
        <span id={newTabNoticeId} hidden>Opens in a new tab.</span>
      </a>
    );
  }

  if (href.startsWith("#") || isSafeMailtoHref(href)) {
    return (
      <a href={href} {...props}>
        {children}
      </a>
    );
  }

  return (
    // prefetch={false}: the static export does emit the RSC payload files
    // next/link prefetches (`__next.*.txt`), so internal links still navigate
    // client-side; prefetch stays off deliberately because a static host has
    // no server to absorb one payload request per in-viewport internal link.
    // Navigations fetch the payload on demand instead.
    <Link href={normalizeInternalHref(href)} prefetch={false} {...props}>
      {children}
    </Link>
  );
}
