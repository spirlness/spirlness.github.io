import { siteProfile } from "@/content/site";
import { SmartLink } from "@/components/ui/SmartLink";

export default function Navbar() {
  return (
    <nav className="distill-grid py-5 sm:py-8 border-b border-gray-100 bg-white/80 backdrop-blur-md sticky top-0 z-50">
      <div />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <SmartLink href="/" className="font-display font-bold text-xl tracking-tight text-accent">
          {siteProfile.navTitle}
        </SmartLink>
        <div className="flex flex-wrap gap-x-4 gap-y-2 sm:gap-8">
          {siteProfile.navLinks.map((link) => (
            <SmartLink
              key={link.href}
              href={link.href}
              className="font-display text-sm font-medium text-gray-500 hover:text-accent transition-colors"
            >
              {link.label}
            </SmartLink>
          ))}
        </div>
      </div>
      <div />
    </nav>
  );
}
