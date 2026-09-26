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
