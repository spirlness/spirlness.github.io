import type { Metadata } from "next";
import { siteProfile } from "@/content/site";
import { SmartLink } from "@/components/ui/SmartLink";

export const metadata: Metadata = {
  title: "Not found",
};

export default function NotFound() {
  return (
    <main className="distill-grid py-24">
      <div />
      <div className="px-6 lg:px-0 text-center">
        <p className="font-display text-sm font-bold tracking-widest text-accent uppercase mb-4">
          404
        </p>
        <h1 className="font-display text-4xl font-bold text-gray-900 mb-4">
          Page not found
        </h1>
        <p className="text-gray-600 mb-8 leading-relaxed">
          The page you requested is not part of this static site.
        </p>
        <SmartLink
          href="/"
          className="inline-flex text-sm font-display font-medium text-accent underline underline-offset-4"
        >
          Back to {siteProfile.name}
        </SmartLink>
      </div>
      <div />
    </main>
  );
}
