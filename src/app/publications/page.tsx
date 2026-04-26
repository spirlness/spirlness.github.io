import { getAllPublications, groupPublicationsByYear, Publication } from '@/lib/bibtex';
import { FileText, Code, ExternalLink, Link as LinkIcon } from 'lucide-react';

const ME = "Li, Yi";

function HighlightAuthors({ authors }: { authors: string }) {
  // Simple highlight logic: find "Li, Yi" and wrap it
  const parts = authors.split(' and ');
  return (
    <span>
      {parts.map((author, index) => {
        const isMe = author.trim() === ME || author.trim() === "Yi Li";
        return (
          <span key={index}>
            {isMe ? <strong className="text-orange-700 font-semibold">{author}</strong> : author}
            {index < parts.length - 1 ? ', ' : ''}
          </span>
        );
      })}
    </span>
  );
}

function PublicationItem({ pub }: { pub: Publication }) {
  return (
    <div className="py-6 border-b border-gray-100 last:border-0">
      <h3 className="text-xl font-display font-medium text-gray-900 mb-2 leading-tight">
        {pub.title}
      </h3>
      <div className="text-gray-600 mb-2">
        <HighlightAuthors authors={pub.authors} />
      </div>
      <div className="text-gray-500 italic mb-4">
        {pub.journal || pub.booktitle}{pub.year ? `, ${pub.year}` : ''}
      </div>
      <div className="flex flex-wrap gap-3">
        {pub.url && (
          <a href={pub.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm font-medium text-orange-600 hover:text-orange-700 transition-colors">
            <LinkIcon size={14} />
            <span>Project</span>
          </a>
        )}
        {pub.pdf && (
          <a href={pub.pdf} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm font-medium text-orange-600 hover:text-orange-700 transition-colors">
            <FileText size={14} />
            <span>PDF</span>
          </a>
        )}
        {pub.code && (
          <a href={pub.code} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm font-medium text-orange-600 hover:text-orange-700 transition-colors">
            <Code size={14} />
            <span>Code</span>
          </a>
        )}
        {pub.arxiv && (
          <a href={`https://arxiv.org/abs/${pub.arxiv}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm font-medium text-orange-600 hover:text-orange-700 transition-colors">
            <ExternalLink size={14} />
            <span>arXiv</span>
          </a>
        )}
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
          <h1 className="text-4xl font-display font-bold text-gray-900 mb-4">Publications</h1>
          <p className="text-lg text-gray-600 max-w-2xl">
            Selected works in physics-informed machine learning and fluid simulation.
          </p>
        </header>

        {years.map(year => (
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
