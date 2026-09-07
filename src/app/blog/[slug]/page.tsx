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
import { JsonLd } from "@/components/meta/JsonLd";
import { buildPageMetadata } from "@/lib/metadata";
import { PostHeader } from "@/components/blog/PostHeader";
import { PostBody } from "@/components/blog/PostBody";
import { PostFooter } from "@/components/blog/PostFooter";

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
    return buildPageMetadata({
      title: frontmatter.title,
      description: frontmatter.excerpt,
      path: `/blog/${slug}/`,
      type: "article",
      publishedTime: frontmatter.date,
      authors: [siteProfile.name],
    });
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
      <PostHeader
        frontmatter={frontmatter}
        readingMinutes={readingMinutes}
      />
      <PostBody
        content={content}
        headings={headings}
        references={references}
      />
      <PostFooter
        newer={newer ? { href: postHref(newer.slug), title: newer.title } : undefined}
        older={older ? { href: postHref(older.slug), title: older.title } : undefined}
        related={related.map((relatedPost) => ({
          href: postHref(relatedPost.slug),
          title: relatedPost.title,
          date: relatedPost.date,
        }))}
      />
    </article>
  );
}
