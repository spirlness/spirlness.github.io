import { Publication } from "@/lib/bibtex";
import { FileText, ExternalLink, Code } from "lucide-react";

interface ReferencesProps {
  references: Publication[];
}

export function References({ references }: ReferencesProps) {
  if (references.length === 0) {
    return null;
  }

  return (
    <section className="mt-24 pt-12 border-t border-gray-100">
      <h2 className="text-2xl font-bold mb-8 font-display text-gray-800 border-b border-gray-100 pb-2">
        References
      </h2>
      <ol className="space-y-6">
        {references.map((pub, index) => (
          <li key={pub.id} className="flex gap-4 text-gray-700">
            <span className="font-mono text-gray-400 flex-none">[{index + 1}]</span>
            <div>
              <p className="font-medium text-gray-900 leading-snug">{pub.title}</p>
              <p className="text-sm text-gray-500 italic mt-1">
                {pub.authors} — {pub.journal || pub.booktitle} ({pub.year})
              </p>
              <div className="flex flex-wrap gap-4 mt-2">
                {pub.pdf && (
                  <a
                    href={pub.pdf}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm font-medium text-orange-600 hover:text-orange-700 transition-colors"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    PDF
                  </a>
                )}
                {pub.url && (
                  <a
                    href={pub.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm font-medium text-orange-600 hover:text-orange-700 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Project
                  </a>
                )}
                {pub.code && (
                  <a
                    href={pub.code}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm font-medium text-orange-600 hover:text-orange-700 transition-colors"
                  >
                    <Code className="w-3.5 h-3.5" />
                    Code
                  </a>
                )}
                {pub.arxiv && (
                  <a
                    href={`https://arxiv.org/abs/${pub.arxiv}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm font-medium text-orange-600 hover:text-orange-700 transition-colors"
                  >
                    arXiv
                  </a>
                )}
              </div>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
