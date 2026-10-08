import type { Publication } from "@/lib/bibtex";
import { FileText, ExternalLink, Code } from "lucide-react";
import { getPublicationLinks } from "@/lib/publication-links";
import { ActionLink } from "@/components/ui/ActionLink";

interface ReferencesProps {
  references: Publication[];
}

const icons = { pdf: <FileText className="w-3.5 h-3.5" />, project: <ExternalLink className="w-3.5 h-3.5" />, code: <Code className="w-3.5 h-3.5" />, arxiv: undefined };

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
          return (
            <li
              key={pub.id}
              id={`ref-${index + 1}`}
              className="flex gap-4 text-gray-700"
            >
              <span className="font-mono text-gray-600 flex-none">
                [{index + 1}]
              </span>
              <div>
                <p className="font-medium text-gray-900 leading-snug">
                  {pub.title}
                </p>
                <p className="text-sm text-gray-600 italic mt-1">
                  {pub.authors} — {pub.journal || pub.booktitle} ({pub.year})
                </p>
                {pub.verification === "unverified" && (
                  <p className="text-sm text-gray-600 mt-1">Publication details awaiting verification.</p>
                )}
                <div className="flex flex-wrap gap-4 mt-2">
                  {getPublicationLinks(pub, ["pdf", "project", "code", "arxiv"]).map(link => (
                    <ActionLink key={link.kind} href={link.href} icon={icons[link.kind]}>
                      {link.label}
                    </ActionLink>
                  ))}
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
