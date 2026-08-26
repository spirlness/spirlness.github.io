import type { Metadata } from "next";
import {
  formatBibtex,
  getAllPublications,
  groupPublicationsByYear,
  Publication,
} from "@/lib/bibtex";
import { FileText, Code, ExternalLink, Link as LinkIcon } from "lucide-react";
import { siteProfile } from "@/content/site";
import { isSafeHttpUrl } from "@/lib/links";
import { BibTeXButton } from "@/components/publications/BibTeXButton";

export const metadata: Metadata = {
  title: "Publications",
};

/**
 * Normalize an author name so highlighting survives BibTeX format drift.
 * Strips grouping braces ({F}uying -> Fuying) and rewrites surname-first
 * entries ("Li, Fuying") to given-name-first ("Fuying Li") so all the
 * canonical forms match the same way.
 */
function normalizeAuthor(name: string): string {
  const cleaned = name.replace(/[{}]/g, "").replace(/\s+/g, " ").trim();
  const commaIndex = cleaned.indexOf(",");
  if (commaIndex !== -1) {
    const last = cleaned.slice(0, commaIndex).trim();
    const first = cleaned.slice(commaIndex + 1).trim();
    return `${first} ${last}`;
  }
  return cleaned;
}

function HighlightAuthors({ authors }: { authors: string }) {
  const parts = authors.split(" and ");
  return (
    <span>
      {parts.map((author, index) => {
        const normalized = normalizeAuthor(author);
        const isMe = siteProfile.publicationAuthorNames.some(
          (name) => normalizeAuthor(name) === normalized
        );
        return (
          <span key={index}>
            {isMe ? (
              <strong className="text-orange-700 font-semibold">{author}</strong>
            ) : (
              author
            )}
            {index < parts.length - 1 ? ", " : ""}
          </span>
        );
      })}
    </span>
  );
}

function PublicationItem({ pub }: { pub: Publication }) {
  const arxivHref = pub.arxiv
    ? pub.arxiv.startsWith("http")
      ? pub.arxiv
      : `https://arxiv.org/abs/${pub.arxiv}`
    : undefined;

  return (
    <div className="py-6 border-b border-gray-100 last:border-0">
      <h3 className="text-xl font-display font-medium text-gray-900 mb-2 leading-tight">
        {pub.title}
      </h3>
      <div className="text-gray-600 mb-2">
        <HighlightAuthors authors={pub.authors} />
      </div>
      <div className="text-gray-500 italic mb-4">
        {pub.journal || pub.booktitle}
        {pub.year ? `, ${pub.year}` : ""}
      </div>
      <div className="flex flex-wrap gap-3">
        {isSafeHttpUrl(pub.url) && (
          <a
            href={pub.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm font-medium text-orange-600 hover:text-orange-700 transition-colors"
          >
            <LinkIcon size={14} />
            <span>Project</span>
          </a>
        )}
        {isSafeHttpUrl(pub.pdf) && (
          <a
            href={pub.pdf}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm font-medium text-orange-600 hover:text-orange-700 transition-colors"
          >
            <FileText size={14} />
            <span>PDF</span>
          </a>
        )}
        {isSafeHttpUrl(pub.code) && (
          <a
            href={pub.code}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm font-medium text-orange-600 hover:text-orange-700 transition-colors"
          >
            <Code size={14} />
            <span>Code</span>
          </a>
        )}
        {isSafeHttpUrl(arxivHref) && (
          <a
            href={arxivHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm font-medium text-orange-600 hover:text-orange-700 transition-colors"
          >
            <ExternalLink size={14} />
            <span>arXiv</span>
          </a>
        )}
        <BibTeXButton bibtex={formatBibtex(pub)} />
      </div>
    </div>
  );
}

export default function PublicationsPage() {
  const publications = getAllPublications();
  const grouped = groupPublicationsByYear(publications);
  const years = Object.keys(grouped).sort((a, b) => parseInt(b) - parseInt(a));

  return (
    <main className="distill-grid py-16">
      <div className="col-start-2 px-6 lg:px-0">
        <header className="mb-12">
          <h1 className="text-4xl font-display font-bold text-gray-900 mb-4">
            Publications
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl">
            {siteProfile.publicationsIntro}
          </p>
        </header>

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
              {grouped[year].map((pub: Publication) => (
                <PublicationItem key={pub.id} pub={pub} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
