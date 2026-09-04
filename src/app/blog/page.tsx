import type { Metadata } from "next";
import { getAllPosts, getAllTags, postHref } from "@/lib/posts";
import { buildPageMetadata } from "@/lib/metadata";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { SmartLink } from "@/components/ui/SmartLink";
import { Tag } from "@/components/ui/Tag";

export const metadata: Metadata = buildPageMetadata({
  title: "Blog",
  description: "Thoughts on physics, computing, and everything in between.",
  path: "/blog/",
});

export default async function BlogPage() {
  const posts = await getAllPosts();
  const tags = getAllTags();

  return (
    <div className="distill-grid py-16">
      <div />
      <main>
        <PageHeader
          title="Blog"
          description="Thoughts on physics, computing, and everything in between."
        />

        {tags.length > 0 && (
          <nav
            aria-label="Tags"
            className="mb-16 flex flex-wrap gap-2 border-b border-gray-100 pb-8"
          >
            {tags.map(({ tag, count }) => (
              <SmartLink
                key={tag}
                href={`/blog/tag/${tag}/`}
                className="text-sm font-mono px-3 py-1 rounded-full bg-gray-100 text-gray-500 hover:text-accent hover:bg-orange-50 transition-colors"
              >
                #{tag}
                <span className="ml-1 text-gray-400">{count}</span>
              </SmartLink>
            ))}
          </nav>
        )}

        <div className="space-y-16">
          {posts.length > 0 ? (
            posts.map((post) => (
              <article key={post.slug} className="group">
                <SmartLink href={postHref(post.slug)}>
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
                  {post.tags.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {post.tags.map((tag) => (
                        <Tag key={tag} variant="muted">#{tag}</Tag>
                      ))}
                    </div>
                  )}
                  <div className="mt-4 flex items-center gap-1 text-sm font-display font-bold text-accent opacity-0 group-hover:opacity-100 transition-opacity">
                    READ MORE <span>→</span>
                  </div>
                </SmartLink>
              </article>
            ))
          ) : (
            <EmptyState>No posts found yet. Check back soon!</EmptyState>
          )}
        </div>
      </main>
      <div />
    </div>
  );
}
