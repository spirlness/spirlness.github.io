import type { PostFrontmatter } from "@/lib/posts";
import { Tag } from "@/components/ui/Tag";

interface PostHeaderProps {
  frontmatter: PostFrontmatter;
  readingMinutes: number;
}

export function PostHeader({
  frontmatter,
  readingMinutes,
}: PostHeaderProps) {
  return (
    <header className="distill-grid mb-10 sm:mb-16">
      <div />
      <div>
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <time className="font-mono text-sm text-gray-400">{frontmatter.date}</time>
          {frontmatter.lastUpdated && (
            <time className="font-mono text-sm text-gray-400">
              Updated {frontmatter.lastUpdated}
            </time>
          )}
          <span className="w-1 h-1 rounded-full bg-gray-200" />
          <span className="text-sm text-gray-400">{readingMinutes} min read</span>
          <span className="w-1 h-1 rounded-full bg-gray-200" />
          <span className="font-display text-xs font-bold tracking-widest text-accent uppercase">Article</span>
          {frontmatter.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 ml-1">
              {frontmatter.tags.map((tag) => (
                <Tag
                  key={tag}
                  href={`/blog/tag/${tag}/`}
                  variant="filter"
                >
                  #{tag}
                </Tag>
              ))}
            </div>
          )}
        </div>
        <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-gray-900 leading-tight">
          {frontmatter.title}
        </h1>
      </div>
      <div />
    </header>
  );
}
