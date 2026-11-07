import type { Metadata } from "next";
import { getAllTags, getPostsByTag, postHref } from "@/lib/posts";
import { notFound } from "next/navigation";
import { siteProfile } from "@/content/site";
import { buildPageMetadata } from "@/lib/metadata";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { SmartLink } from "@/components/ui/SmartLink";
import { PostCard } from "@/components/blog/PostCard";

export const dynamicParams = false;

export function generateStaticParams() {
  return getAllTags().map(({ tag }) => ({ tag }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ tag: string }>;
}): Promise<Metadata> {
  const { tag } = await params;
  return buildPageMetadata({
    title: `Tag: ${tag}`,
    description: `Posts tagged "${tag}" on ${siteProfile.name}'s blog.`,
    path: `/blog/tag/${tag}/`,
  });
}

export default async function TagPage({
  params,
}: {
  params: Promise<{ tag: string }>;
}) {
  const { tag } = await params;
  const posts = getPostsByTag(tag);
  if (posts.length === 0) {
    notFound();
  }

  return (
    <div className="distill-grid py-16">
      <div />
      <main id="main-content" tabIndex={-1}>
        <SmartLink
          href="/blog/"
          className="inline-flex items-center gap-2 text-sm font-display font-medium text-gray-600 hover:text-accent transition-colors mb-8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          All Posts
        </SmartLink>

        <PageHeader
          eyebrow="Tag"
          title={`#${tag}`}
          description={`${posts.length} ${posts.length === 1 ? "post" : "posts"} tagged with this topic.`}
          variant="tag"
        />

        <div className="space-y-12">
          {posts.map((post) => (
            <PostCard
              key={post.slug}
              post={post}
              href={postHref(post.slug)}
              showTags
              showReadMore
            />
          ))}
        </div>
      </main>
      <div />
    </div>
  );
}
