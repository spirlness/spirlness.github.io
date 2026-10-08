import { FileText, Code, ExternalLink, Link as LinkIcon } from "lucide-react";
import type { Publication } from "@/lib/bibtex";
import { siteProfile } from "@/content/site";
import { getPublicationLinks } from "@/lib/publication-links";
import { BibTeXButton } from "@/components/publications/BibTeXButton";
import { ActionLink } from "@/components/ui/ActionLink";

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

// Optimization: Pre-normalize site profile author names once at module evaluation.
// Direct Set lookup converts O(N_pubs * A_authors * M_names) string normalizations
// and array iterations into a single O(1) Set lookup per author during render.
const NORMALIZED_MY_NAMES = new Set(
  siteProfile.publicationAuthorNames.map(normalizeAuthor)
);

function HighlightAuthors({ authors }: { authors: string }) {
  const parts = authors.split(" and ");
  return (
    <span>
      {parts.map((author, index) => {
        const normalized = normalizeAuthor(author);
        const isMe = NORMALIZED_MY_NAMES.has(normalized);
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

interface PublicationItemProps {
  pub: Publication;
  bibtex: string;
}

const icons = { project: <LinkIcon size={14} />, pdf: <FileText size={14} />, code: <Code size={14} />, arxiv: <ExternalLink size={14} /> };

export function PublicationItem({ pub, bibtex }: PublicationItemProps) {

  return (
    <div className="py-6 border-b border-gray-100 last:border-0">
      <h3 className="text-xl font-display font-medium text-gray-900 mb-2 leading-tight">
        {pub.title}
      </h3>
      <div className="text-gray-600 mb-2">
        <HighlightAuthors authors={pub.authors} />
      </div>
      <div className="text-gray-600 italic mb-4">
        {pub.journal || pub.booktitle}
        {pub.year ? `, ${pub.year}` : ""}
      </div>
      {pub.verification === "unverified" && (
        <p className="text-sm text-gray-600 mb-3">Publication details awaiting verification.</p>
      )}
      <div className="flex flex-wrap gap-3">
        {getPublicationLinks(pub).map(link => (
          <ActionLink key={link.kind} href={link.href} icon={icons[link.kind]}>
            <span>{link.label}</span>
          </ActionLink>
        ))}
        <BibTeXButton bibtex={bibtex} />
      </div>
    </div>
  );
}
