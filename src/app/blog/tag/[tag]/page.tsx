import type { Metadata } from "next";
import { getAllTags, getPostsByTag, postHref } from "@/lib/posts";
import { notFound } from "next/navigation";
import { siteProfile } from "@/content/site";

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
  return {
    title: `Tag: ${tag}`,
    description: `Posts tagged "${tag}" on ${siteProfile.name}'s blog.`,
  };
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
        <header className="mb-16">
          <p className="text-sm font-display font-bold tracking-widest text-accent uppercase mb-3">
            Tag
          </p>
          <h1 className="font-display text-4xl sm:text-5xl font-bold mb-4 text-gray-900">
            #{tag}
          </h1>
          <p className="text-lg text-gray-500">
            {posts.length} {posts.length === 1 ? "post" : "posts"} tagged with
            this topic.
          </p>
        </header>

        <div className="space-y-12">
          {posts.map((post) => (
            <article key={post.slug} className="group">
              <a href={postHref(post.slug)}>
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
              </a>
            </article>
          ))}
        </div>
      </main>
      <div />
    </div>
  );
}
