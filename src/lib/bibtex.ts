import { parse } from '@retorquere/bibtex-parser';
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

  // sentenceCase: false keeps the original title casing (default sentence-cases
  // titles); verbatimFields keeps `author` as the raw "Last, First and ..."
  // string instead of parsed {lastName, firstName} objects, which the
  // publications page and formatBibtex both expect.
  const parsed = parse(bibContent, {
    sentenceCase: false,
    verbatimFields: ["author"],
  });

  // A malformed entry is skipped with an error instead of parsed, which would
  // silently drop it from /publications and break every [@key] citing it —
  // fail the build loudly instead.
  if (parsed.errors.length > 0) {
    const first = parsed.errors[0];
    throw new Error(
      `Failed to parse content/references.bib: ${first.error}`
    );
  }

  const cleanField = (value: unknown): string | undefined => {
    if (typeof value !== 'string') return undefined;
    return value.replace(/[{}]/g, '').trim();
  };

  const publications: Publication[] = parsed.entries.map((entry: { type: string; key: string; fields: Record<string, string> }) => {
    const fields = entry.fields;
    return {
      id: entry.key || 'anonymous',
      type: entry.type || 'misc',
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
