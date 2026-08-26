import * as bibtexParse from 'bibtex-parse-js';
import fs from 'fs';
import path from 'path';

export interface Publication {
  id: string;
  type: string;
  title: string;
  authors: string;
  year: string;
  journal?: string;
  booktitle?: string;
  url?: string;
  pdf?: string;
  code?: string;
  arxiv?: string;
}

export function getAllPublications(): Publication[] {
  const bibPath = path.join(process.cwd(), 'content', 'references.bib');
  const bibContent = fs.readFileSync(bibPath, 'utf-8');

  const parsed = bibtexParse.toJSON(bibContent);

  const cleanField = (value: unknown): string | undefined => {
    if (typeof value !== 'string') return undefined;
    return value.replace(/[{}]/g, '').trim();
  };

  const publications: Publication[] = parsed.map((entry: bibtexParse.BibtexEntry) => {
    const fields = entry.entryTags;
    return {
      id: entry.citationKey || 'anonymous',
      type: entry.entryType || 'misc',
      title: cleanField(fields.title) || '(Untitled)',
      authors: cleanField(fields.author) || 'Unknown',
      year: cleanField(fields.year) || 'Unknown',
      journal: cleanField(fields.journal),
      booktitle: cleanField(fields.booktitle),
      url: cleanField(fields.url),
      pdf: cleanField(fields.pdf),
      code: cleanField(fields.code),
      arxiv: cleanField(fields.arxiv),
    };
  });

  const yearToNumber = (year: string): number => {
    const parsed = parseInt(year, 10);
    return Number.isNaN(parsed) ? Number.MIN_SAFE_INTEGER : parsed;
  };

  return publications.sort(
    (a, b) => yearToNumber(b.year) - yearToNumber(a.year)
  );
}

export function groupPublicationsByYear(publications: Publication[]): Record<string, Publication[]> {
  return publications.reduce((groups, pub) => {
    const year = pub.year;
    if (!groups[year]) {
      groups[year] = [];
    }
    groups[year].push(pub);
    return groups;
  }, {} as Record<string, Publication[]>);
}

/** Reconstruct a pasteable BibTeX entry from a cleaned Publication record. */
export function formatBibtex(pub: Publication): string {
  const lines: string[] = [`@${pub.type}{${pub.id},`];
  const field = (key: string, value: string | undefined) => {
    if (!value) return;
    lines.push(`  ${key} = {${value}},`);
  };

  field("title", pub.title);
  field("author", pub.authors);
  field("journal", pub.journal);
  field("booktitle", pub.booktitle);
  field("year", pub.year);
  field("url", pub.url);
  field("pdf", pub.pdf);
  field("code", pub.code);
  field("arxiv", pub.arxiv);

  // Drop trailing comma on the last field line for valid BibTeX style.
  const last = lines.length - 1;
  if (last > 0 && lines[last].endsWith(",")) {
    lines[last] = lines[last].slice(0, -1);
  }
  lines.push("}");
  return lines.join("\n");
}
