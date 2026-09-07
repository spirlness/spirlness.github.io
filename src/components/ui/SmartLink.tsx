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
    // prefetch={false}: on a plain static host (`serve out`, GitHub Pages) the
    // RSC payload files next/link prefetches (`__next.*.txt?_rsc=…`) do not
    // exist, so every internal link logged a console 404. Clicks still work —
    // they fall back to full page loads, which is all a static export has.
    <Link href={normalizeInternalHref(href)} prefetch={false} {...props}>
      {children}
    </Link>
  );
}
