import type { Metadata } from "next";
import { getAllPosts, getAllTags } from "@/lib/posts";
import { buildPageMetadata } from "@/lib/metadata";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { SmartLink } from "@/components/ui/SmartLink";
import { PostCard } from "@/components/blog/PostCard";

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
              <PostCard key={post.slug} post={post} showTags showReadMore />
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
