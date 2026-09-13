import type { Metadata } from "next";
import {
  formatBibtex,
  getAllPublications,
  groupPublicationsByYear,
} from "@/lib/bibtex";
import { siteProfile } from "@/content/site";
import { isSafeHttpUrl } from "@/lib/links";
import { JsonLd } from "@/components/meta/JsonLd";
import { buildPageMetadata } from "@/lib/metadata";
import { PageHeader } from "@/components/ui/PageHeader";
import { PublicationItem } from "@/components/publications/PublicationItem";

export const metadata: Metadata = buildPageMetadata({
  title: "Publications",
  description: siteProfile.publicationsIntro,
  path: "/publications/",
});

export default function PublicationsPage() {
  const publications = getAllPublications();
  const grouped = groupPublicationsByYear(publications);
  const years = Object.keys(grouped).sort((a, b) => parseInt(b) - parseInt(a));

  return (
    <main id="main-content" tabIndex={-1} className="distill-grid py-16">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: "Publications",
          itemListElement: publications.map((pub, index) => ({
            "@type": "ListItem",
            position: index + 1,
            item: {
              "@type": "ScholarlyArticle",
              headline: pub.title,
              ...(isSafeHttpUrl(pub.url) ? { url: pub.url } : {}),
              ...(pub.year ? { datePublished: String(pub.year) } : {}),
              ...(pub.journal || pub.booktitle
                ? { publisher: pub.journal || pub.booktitle }
                : {}),
              author: pub.authors
                .split(" and ")
                .map((name) => ({
                  "@type": "Person",
                  name: name.replace(/[{}]/g, "").trim(),
                })),
            },
          })),
        }}
      />
      <div className="col-start-2 px-6 lg:px-0">
        <PageHeader
          variant="compact"
          title="Publications"
          description={siteProfile.publicationsIntro}
        />

        {years.map((year) => (
          <section key={year} className="mb-12 relative">
            <div className="absolute -left-16 top-6 hidden lg:block">
              <span className="text-2xl font-display font-bold text-gray-200 rotate-180 [writing-mode:vertical-lr]">
                {year}
              </span>
            </div>
            <h2 className="text-2xl font-display font-bold text-gray-400 mb-6 lg:hidden">
              {year}
            </h2>
            <div className="space-y-2">
              {grouped[year].map((pub) => (
                <PublicationItem
                  key={pub.id}
                  pub={pub}
                  bibtex={formatBibtex(pub)}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
