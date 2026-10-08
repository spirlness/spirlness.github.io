"use client";

import { usePathname } from "next/navigation";
import { SmartLink } from "@/components/ui/SmartLink";

interface NavbarProps {
  navTitle: string;
  navLinks: { href: string; label: string }[];
}

/** Keep configuration validation on the server; only navigation data hydrates. */
export default function Navbar({ navTitle, navLinks }: NavbarProps) {
  const pathname = usePathname();

  return (
    <nav className="distill-grid py-5 sm:py-8 border-b border-gray-100 bg-white/80 backdrop-blur-md sticky top-0 z-50">
      <div />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <SmartLink
          href="/"
          className="font-display font-bold text-xl tracking-tight text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-md"
        >
          {navTitle}
        </SmartLink>
        <div className="flex flex-wrap gap-x-4 gap-y-2 sm:gap-8">
          {navLinks.map((link) => {
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
                className={`font-display text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-md ${
                  isActive ? "text-accent" : "text-gray-600 hover:text-accent"
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
