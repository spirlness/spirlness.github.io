"use client";

import { useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { SmartLink } from "@/components/ui/SmartLink";

interface NavbarProps {
  navTitle: string;
  navLinks: { href: string; label: string }[];
}

function isCurrentPath(pathname: string, href: string) {
  return href === "/"
    ? pathname === "/"
    : pathname === href.replace(/\/$/, "") || pathname.startsWith(href);
}

/** Keep configuration validation on the server; only navigation data hydrates. */
export default function Navbar(props: NavbarProps) {
  const pathname = usePathname();
  return <NavbarContent key={pathname} pathname={pathname} {...props} />;
}

function NavbarContent({ navTitle, navLinks, pathname }: NavbarProps & { pathname: string }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);

  function closeMenu(restoreFocus = false) {
    setMenuOpen(false);
    if (restoreFocus) menuButton.current?.focus();
  }

  return (
    <nav
      aria-label="Primary"
      className="sticky top-0 z-50 border-b border-stone-200/80 bg-[#fdfdfd]/90 font-sans backdrop-blur-xl"
      onKeyDown={(event) => {
        if (event.key === "Escape" && menuOpen) closeMenu(true);
      }}
    >
      <div className="mx-auto flex min-h-[4.75rem] max-w-[1180px] flex-col px-5 sm:px-8 md:min-h-[5.25rem] md:flex-row md:items-center md:justify-between">
        <div className="flex min-h-[4.75rem] items-center justify-between md:min-h-0">
          <SmartLink
            href="/"
            onClick={() => closeMenu()}
            className="font-display text-[1.75rem] leading-none text-stone-900 transition-colors hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-4"
          >
            <span className="capitalize">{navTitle.toLowerCase()}</span><span className="text-accent">.</span>
          </SmartLink>
          <button
            ref={menuButton}
            type="button"
            aria-expanded={menuOpen}
            aria-controls="primary-navigation-links"
            aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
            onClick={() => setMenuOpen((open) => !open)}
            className="-mr-2 flex size-11 items-center justify-center rounded-full text-stone-700 transition-colors hover:bg-stone-100 hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent md:hidden"
          >
            {menuOpen ? <X className="size-5" aria-hidden="true" /> : <Menu className="size-5" aria-hidden="true" />}
          </button>
        </div>
        <div
          id="primary-navigation-links"
          className={`${menuOpen ? "grid" : "hidden"} gap-1 border-t border-stone-100 py-4 md:flex md:items-center md:gap-8 md:border-0 md:py-0`}
        >
          {navLinks.map((link) => {
            const isActive = isCurrentPath(pathname, link.href);
            return (
              <SmartLink
                key={link.href}
                href={link.href}
                aria-label={link.label}
                aria-current={isActive ? "page" : undefined}
                onClick={() => closeMenu()}
                className={`group relative flex min-h-11 items-center rounded-md px-3 py-2 text-[0.9375rem] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent md:min-h-0 md:px-0 md:py-3 ${
                  isActive ? "bg-stone-100 text-accent md:bg-transparent" : "text-stone-600 hover:bg-stone-50 hover:text-stone-950 md:hover:bg-transparent"
                }`}
              >
                <span className="capitalize">{link.label.toLowerCase()}</span>
                <span className={`absolute inset-x-3 bottom-1 h-px bg-accent transition-transform duration-200 md:inset-x-0 md:bottom-0 ${isActive ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"}`} aria-hidden="true" />
              </SmartLink>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
