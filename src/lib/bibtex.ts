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
  
  const publications: Publication[] = parsed.map((entry: any) => {
    const fields = entry.entryTags;
    return {
      id: entry.citationKey,
      type: entry.entryType,
      title: fields.title.replace(/{|}/g, ''), // Remove BibTeX curly braces
      authors: fields.author,
      year: fields.year,
      journal: fields.journal,
      booktitle: fields.booktitle,
      url: fields.url,
      pdf: fields.pdf,
      code: fields.code,
      arxiv: fields.arxiv,
    };
  });

  // Sort by year descending
  return publications.sort((a, b) => parseInt(b.year) - parseInt(a.year));
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
