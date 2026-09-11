"use client";

import { usePathname } from "next/navigation";
import { siteProfile } from "@/content/site";
import { SmartLink } from "@/components/ui/SmartLink";

/**
 * Site header. Client-side because the current-page highlight needs
 * `usePathname()`; the nav data still comes from the server-only `siteProfile`
 * import, which is a plain object literal and therefore safe to bundle.
 */
export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="distill-grid py-5 sm:py-8 border-b border-gray-100 bg-white/80 backdrop-blur-md sticky top-0 z-50">
      <div />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <SmartLink href="/" className="font-display font-bold text-xl tracking-tight text-accent">
          {siteProfile.navTitle}
        </SmartLink>
        <div className="flex flex-wrap gap-x-4 gap-y-2 sm:gap-8">
          {siteProfile.navLinks.map((link) => {
            // `usePathname()` returns the un-trailed form Next normalizes to;
            // compare on the route prefix so `/projects/<id>/` still lights
            // PROJECTS. HOME (`/`) only matches the exact root.
            const href = link.href;
            const isActive =
              href === "/"
                ? pathname === "/"
                : pathname === href.replace(/\/$/, "") ||
                  pathname.startsWith(href);
            return (
              <SmartLink
                key={href}
                href={href}
                aria-current={isActive ? "page" : undefined}
                className={`font-display text-sm font-medium transition-colors ${
                  isActive ? "text-accent" : "text-gray-500 hover:text-accent"
                }`}
              >
                {link.label}
              </SmartLink>
            );
          })}
        </div>
      </div>
      <div />
    </nav>
  );
}
