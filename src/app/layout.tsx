import type { Metadata } from "next";
import { inter, serif, display } from "@/lib/fonts";
import Navbar from "@/components/layout/Navbar";
import { siteProfile } from "@/content/site";
import 'katex/dist/katex.min.css';
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(siteProfile.url),
  title: {
    default: siteProfile.title,
    template: `%s — ${siteProfile.title}`,
  },
  description: siteProfile.description,
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteProfile.url,
    siteName: siteProfile.title,
    title: siteProfile.title,
    description: siteProfile.description,
  },
  twitter: {
    card: "summary_large_image",
    title: siteProfile.title,
    description: siteProfile.description,
  },
  alternates: {
    types: {
      "application/rss+xml": `${siteProfile.url}/feed.xml`,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${serif.variable} ${display.variable} antialiased`}
    >
      <body className="min-h-screen font-serif bg-[#fdfdfd] text-gray-900">
        <Navbar />
        {children}
        <footer className="distill-grid py-16 border-t border-gray-100 mt-16 text-gray-400 text-sm">
          <div />
          <div>
            © {new Date().getFullYear()} {siteProfile.name}. Built with Next.js and Distill aesthetics.
          </div>
          <div />
        </footer>
      </body>
    </html>
  );
}
