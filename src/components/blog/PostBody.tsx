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
      {headings.length > 0 && (
        <div className="col-start-2 min-[1400px]:col-start-1 min-[1400px]:row-start-1">
          <TableOfContents headings={headings} />
        </div>
      )}
      <div className={`col-start-2 min-[1400px]:row-start-1 relative ${articleProse}`}>
        {content}
        {references.length > 0 && <References references={references} />}
      </div>
    </div>
  );
}
