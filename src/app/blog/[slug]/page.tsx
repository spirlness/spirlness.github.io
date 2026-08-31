import type { Metadata } from "next";
import {
  getPostBySlug,
  getAllPosts,
  getPostFrontmatter,
  getAdjacentPosts,
  getRelatedPosts,
  postHref,
} from "@/lib/posts";
import { siteProfile } from "@/content/site";
import { notFound } from "next/navigation";
import { References } from "@/components/mdx/References";
import { articleProse } from "@/components/mdx/MDXComponents";
import { TableOfContents } from "@/components/mdx/TableOfContents";
import { JsonLd } from "@/components/meta/JsonLd";

interface PostPageProps {
  params: Promise<{
    slug: string;
  }>;
}

// Block dynamic route generation so ungenerated slugs 404 instead of
// attempting dynamic rendering (which `output: "export"` cannot serve).
export const dynamicParams = false;

/**
 * 实现 generateStaticParams 以支持静态导出 (output: export)
 */
export async function generateStaticParams() {
  const posts = await getAllPosts();
  return posts.map((post) => ({
    slug: post.slug,
  }));
}

export async function generateMetadata({ params }: PostPageProps): Promise<Metadata> {
  const { slug } = await params;
  try {
    const frontmatter = getPostFrontmatter(slug);
    return {
      title: frontmatter.title,
      description: frontmatter.excerpt,
      openGraph: {
        type: "article",
        title: frontmatter.title,
        description: frontmatter.excerpt,
        url: `${siteProfile.url}/blog/${slug}/`,
        publishedTime: frontmatter.date,
        authors: [siteProfile.name],
        images: [`${siteProfile.url}/opengraph-image.png`],
      },
      twitter: {
        title: frontmatter.title,
        description: frontmatter.excerpt,
        images: [`${siteProfile.url}/opengraph-image.png`],
      },
    };
  } catch {
    return { title: siteProfile.title };
  }
}

export default async function PostPage({ params }: PostPageProps) {
  const { slug } = await params;

  let post: Awaited<ReturnType<typeof getPostBySlug>> | undefined;
  try {
    post = await getPostBySlug(slug);
  } catch (error) {
    console.error("Error loading post:", error);
    notFound();
  }

  if (!post) {
    notFound();
  }

  const { content, frontmatter, references, headings, readingMinutes } = post;
  const { newer, older } = getAdjacentPosts(slug);
  const related = getRelatedPosts(slug, 2);

  return (
    <article className="py-10 sm:py-16">
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            headline: frontmatter.title,
            description: frontmatter.excerpt,
            datePublished: frontmatter.date,
            url: `${siteProfile.url}/blog/${slug}/`,
            author: { "@type": "Person", name: siteProfile.name },
            mainEntityOfPage: {
              "@type": "WebPage",
              "@id": `${siteProfile.url}/blog/${slug}/`,
            },
          }}
        />
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
                    <a
                      key={tag}
                      href={`/blog/tag/${tag}/`}
                      className="text-xs font-mono px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 hover:text-accent hover:bg-orange-50 transition-colors"
                    >
                      #{tag}
                    </a>
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

        <div className="distill-grid">
          <div>{headings.length > 0 && <TableOfContents headings={headings} />}</div>
          <div className={`relative ${articleProse}`}>
            {content}
            {references.length > 0 && <References references={references} />}
          </div>
          <div />
        </div>

        <footer className="distill-grid mt-16 sm:mt-24">
          <div />
          <div className="border-t border-gray-100 pt-8 sm:pt-12 space-y-10">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center font-display font-bold text-orange-600">
                {siteProfile.authorInitial}
              </div>
              <div>
                <p className="font-bold text-gray-900">{siteProfile.name}</p>
                <p className="text-sm text-gray-500">{siteProfile.authorRole}</p>
              </div>
            </div>

            {(newer || older) && (
              <div className="flex justify-between gap-6 border-t border-gray-100 pt-6 text-sm">
                {older ? (
                  <a href={postHref(older.slug)} className="group max-w-[45%]">
                    <span className="block text-xs font-display font-bold tracking-widest text-gray-400 uppercase mb-1">
                      Older
                    </span>
                    <span className="font-medium text-gray-700 group-hover:text-accent transition-colors">
                      {older.title}
                    </span>
                  </a>
                ) : (
                  <span />
                )}
                {newer ? (
                  <a href={postHref(newer.slug)} className="group text-right max-w-[45%]">
                    <span className="block text-xs font-display font-bold tracking-widest text-gray-400 uppercase mb-1">
                      Newer
                    </span>
                    <span className="font-medium text-gray-700 group-hover:text-accent transition-colors">
                      {newer.title}
                    </span>
                  </a>
                ) : (
                  <span />
                )}
              </div>
            )}

            {related.length > 0 && (
              <div className="border-t border-gray-100 pt-6">
                <p className="text-xs font-display font-bold tracking-widest text-gray-400 uppercase mb-4">
                  Related
                </p>
                <ul className="space-y-3">
                  {related.map((post) => (
                    <li key={post.slug}>
                      <a
                        href={postHref(post.slug)}
                        className="group inline-flex flex-col gap-0.5"
                      >
                        <span className="font-medium text-gray-700 group-hover:text-accent transition-colors">
                          {post.title}
                        </span>
                        <span className="text-sm text-gray-400 font-mono">
                          {post.date}
                        </span>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          <div />
        </footer>
      </article>
  );
}
