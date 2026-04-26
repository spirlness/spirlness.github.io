/* eslint-disable @next/next/no-html-link-for-pages */
import { siteProfile } from "@/content/site";

export default function Navbar() {
  return (
    <nav className="distill-grid py-8 border-b border-gray-100 bg-white/80 backdrop-blur-md sticky top-0 z-50">
      <div />
      <div className="flex justify-between items-center">
        <a href="/" className="font-display font-bold text-xl tracking-tight text-accent">
          {siteProfile.navTitle}
        </a>
        <div className="flex gap-8">
          {siteProfile.navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="font-display text-sm font-medium text-gray-500 hover:text-accent transition-colors"
            >
              {link.label}
            </a>
          ))}
        </div>
      </div>
      <div />
    </nav>
  );
}
