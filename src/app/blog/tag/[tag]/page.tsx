import type { Metadata } from "next";
import { getAllTags, getPostsByTag, postHref } from "@/lib/posts";
import { notFound } from "next/navigation";
import { siteProfile } from "@/content/site";
import { buildPageMetadata } from "@/lib/metadata";
import { PageHeader } from "@/components/ui/PageHeader";
import { SmartLink } from "@/components/ui/SmartLink";

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
      <main>
        <PageHeader
          eyebrow="Tag"
          title={`#${tag}`}
          description={`${posts.length} ${posts.length === 1 ? "post" : "posts"} tagged with this topic.`}
          variant="tag"
        />

        <div className="space-y-12">
          {posts.map((post) => (
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
              </SmartLink>
            </article>
          ))}
        </div>
      </main>
      <div />
    </div>
  );
}
