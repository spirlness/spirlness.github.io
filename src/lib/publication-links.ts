import type { Publication } from "./bibtex";
import { isSafeHttpUrl } from "./links";

export type PublicationLinkKind = "project" | "pdf" | "code" | "arxiv";
const labels = { project: "Project", pdf: "PDF", code: "Code", arxiv: "arXiv" };
const defaultOrder: readonly PublicationLinkKind[] = ["project", "pdf", "code", "arxiv"];

function arxivUrl(value: string | undefined): string | undefined {
  const clean = value?.trim();
  if (!clean) return undefined;
  if (isSafeHttpUrl(clean)) return clean;
  // Both modern identifiers and legacy subject/number identifiers are supported.
  if (/^(?:\d{4}\.\d{4,5}|[a-z][a-z.-]*\/\d{7})(?:v\d+)?$/i.test(clean)) {
    return `https://arxiv.org/abs/${clean}`;
  }
  return undefined;
}

/** Shared destinations/labels; each view keeps its own ordering and presentation. */
export function getPublicationLinks(
  publication: Pick<Publication, "url" | "pdf" | "code" | "arxiv">,
  order: readonly PublicationLinkKind[] = defaultOrder,
): { kind: PublicationLinkKind; label: string; href: string }[] {
  const targets = { project: publication.url, pdf: publication.pdf, code: publication.code, arxiv: arxivUrl(publication.arxiv) };
  return order.flatMap(kind => {
    const href = targets[kind]?.trim();
    return isSafeHttpUrl(href) ? [{ kind, label: labels[kind], href }] : [];
  });
}
