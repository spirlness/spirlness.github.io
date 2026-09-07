import { FileText, Code, ExternalLink, Link as LinkIcon } from "lucide-react";
import { siteProfile } from "@/content/site";
import { formatBibtex, type Publication } from "@/lib/bibtex";
import { isSafeHttpUrl } from "@/lib/links";
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

interface PublicationItemProps {
  pub: Publication;
}

export function PublicationItem({ pub }: PublicationItemProps) {
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
          <ActionLink href={pub.url} icon={<LinkIcon size={14} />}>
            <span>Project</span>
          </ActionLink>
        )}
        {isSafeHttpUrl(pub.pdf) && (
          <ActionLink href={pub.pdf} icon={<FileText size={14} />}>
            <span>PDF</span>
          </ActionLink>
        )}
        {isSafeHttpUrl(pub.code) && (
          <ActionLink href={pub.code} icon={<Code size={14} />}>
            <span>Code</span>
          </ActionLink>
        )}
        {isSafeHttpUrl(arxivHref) && (
          <ActionLink href={arxivHref} icon={<ExternalLink size={14} />}>
            <span>arXiv</span>
          </ActionLink>
        )}
        <BibTeXButton bibtex={formatBibtex(pub)} />
      </div>
    </div>
  );
}
