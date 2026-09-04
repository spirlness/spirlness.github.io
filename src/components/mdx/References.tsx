import { Publication } from "@/lib/bibtex";
import { FileText, ExternalLink, Code } from "lucide-react";
import { isSafeHttpUrl } from "@/lib/links";
import { ActionLink } from "@/components/ui/ActionLink";

interface ReferencesProps {
  references: Publication[];
}

export function References({ references }: ReferencesProps) {
  if (references.length === 0) {
    return null;
  }

  return (
    <section className="not-prose mt-24 pt-12 border-t border-gray-100">
      <h2 className="text-2xl font-bold mb-8 font-display text-gray-800 border-b border-gray-100 pb-2">
        References
      </h2>
      <ol className="space-y-6">
        {references.map((pub, index) => {
          const arxivHref = pub.arxiv
            ? pub.arxiv.startsWith("http")
              ? pub.arxiv
              : `https://arxiv.org/abs/${pub.arxiv}`
            : undefined;

          return (
            <li
              key={pub.id}
              id={`ref-${index + 1}`}
              className="flex gap-4 text-gray-700 scroll-mt-24"
            >
              <span className="font-mono text-gray-400 flex-none">
                [{index + 1}]
              </span>
              <div>
                <p className="font-medium text-gray-900 leading-snug">
                  {pub.title}
                </p>
                <p className="text-sm text-gray-500 italic mt-1">
                  {pub.authors} — {pub.journal || pub.booktitle} ({pub.year})
                </p>
                <div className="flex flex-wrap gap-4 mt-2">
                  {isSafeHttpUrl(pub.pdf) && (
                    <ActionLink href={pub.pdf} icon={<FileText className="w-3.5 h-3.5" />}>
                      PDF
                    </ActionLink>
                  )}
                  {isSafeHttpUrl(pub.url) && (
                    <ActionLink href={pub.url} icon={<ExternalLink className="w-3.5 h-3.5" />}>
                      Project
                    </ActionLink>
                  )}
                  {isSafeHttpUrl(pub.code) && (
                    <ActionLink href={pub.code} icon={<Code className="w-3.5 h-3.5" />}>
                      Code
                    </ActionLink>
                  )}
                  {isSafeHttpUrl(arxivHref) && (
                    <ActionLink href={arxivHref}>
                      arXiv
                    </ActionLink>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
