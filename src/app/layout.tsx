import type { Metadata } from "next";
import { inter, serif, display } from "@/lib/fonts";
import Navbar from "@/components/layout/Navbar";
import 'katex/dist/katex.min.css';
import "./globals.css";

export const metadata: Metadata = {
  title: "Personal Academic Website",
  description: "Physics and Deep Learning Research",
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
            © {new Date().getFullYear()} Spirlness. Built with Next.js and Distill aesthetics.
          </div>
          <div />
        </footer>
      </body>
    </html>
  );
}
