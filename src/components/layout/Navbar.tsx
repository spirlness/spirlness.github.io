import Link from "next/link";

export default function Navbar() {
  const links = [
    { href: "/", label: "HOME" },
    { href: "/publications", label: "PUBLICATIONS" },
    { href: "/blog", label: "BLOG" },
  ];

  return (
    <nav className="distill-grid py-8 border-b border-gray-100 bg-white/80 backdrop-blur-md sticky top-0 z-50">
      <div />
      <div className="flex justify-between items-center">
        <Link href="/" className="font-display font-bold text-xl tracking-tight text-accent">
          SPIRLNESS
        </Link>
        <div className="flex gap-8">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="font-display text-sm font-medium text-gray-500 hover:text-accent transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
      <div />
    </nav>
  );
}
