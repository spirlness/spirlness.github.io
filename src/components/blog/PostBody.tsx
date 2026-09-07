import type { ReactNode } from "react";
import type { TocHeading } from "@/lib/posts";
import type { Publication } from "@/lib/bibtex";
import { References } from "@/components/mdx/References";
import { articleProse } from "@/components/mdx/MDXComponents";
import { TableOfContents } from "@/components/mdx/TableOfContents";

interface PostBodyProps {
  content: ReactNode;
  headings: TocHeading[];
  references: Publication[];
}

export function PostBody({
  content,
  headings,
  references,
}: PostBodyProps) {
  return (
    <div className="distill-grid">
      <div>{headings.length > 0 && <TableOfContents headings={headings} />}</div>
      <div className={`relative ${articleProse}`}>
        {content}
        {references.length > 0 && <References references={references} />}
      </div>
      <div />
    </div>
  );
}
