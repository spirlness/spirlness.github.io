import type { PostFrontmatter } from "@/lib/posts";
import { SmartLink } from "@/components/ui/SmartLink";
import { Tag } from "@/components/ui/Tag";

interface PostCardProps {
  post: PostFrontmatter;
  href: string;
  showTags?: boolean;
  showReadMore?: boolean;
}

export function PostCard({
  post,
  href,
  showTags = false,
  showReadMore = false,
}: PostCardProps) {
  return (
    <article className="group">
      <SmartLink href={href}>
        <div className="flex flex-col md:flex-row md:items-baseline justify-between mb-2">
          <h2 className="text-2xl font-bold font-display group-hover:text-accent transition-colors">
            {post.title}
          </h2>
          <time className="text-sm font-mono text-gray-400">
            {post.date}
          </time>
        </div>
        <p className="text-gray-600 leading-relaxed text-lg">
          {post.excerpt}
        </p>
        {showTags && post.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <Tag key={tag} variant="muted">#{tag}</Tag>
            ))}
          </div>
        )}
        {showReadMore && (
          <div className="mt-4 flex items-center gap-1 text-sm font-display font-bold text-accent opacity-0 group-hover:opacity-100 transition-opacity">
            READ MORE <span>→</span>
          </div>
        )}
      </SmartLink>
    </article>
  );
}
