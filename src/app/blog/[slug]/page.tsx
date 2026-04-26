import { getPostBySlug, getAllPosts } from "@/lib/posts";
import { siteProfile } from "@/content/site";
import { notFound } from "next/navigation";

interface PostPageProps {
  params: Promise<{
    slug: string;
  }>;
}

/**
 * 实现 generateStaticParams 以支持静态导出 (output: export)
 */
export async function generateStaticParams() {
  const posts = await getAllPosts();
  return posts.map((post) => ({
    slug: post.slug,
  }));
}

export default async function PostPage({ params }: PostPageProps) {
  const { slug } = await params;
  
  let post;
  try {
    post = await getPostBySlug(slug);
  } catch (error) {
    console.error("Error loading post:", error);
    notFound();
  }

  const { content, frontmatter } = post;

  return (
    <article className="py-16">
        <header className="distill-grid mb-16">
          <div />
          <div>
            <div className="flex items-center gap-4 mb-6">
              <time className="font-mono text-sm text-gray-400">{frontmatter.date}</time>
              <span className="w-1 h-1 rounded-full bg-gray-200" />
              <span className="font-display text-xs font-bold tracking-widest text-accent uppercase">Article</span>
            </div>
            <h1 className="font-display text-5xl md:text-6xl font-bold tracking-tight text-gray-900 leading-tight">
              {frontmatter.title}
            </h1>
          </div>
          <div />
        </header>

        <div className="distill-grid prose prose-lg prose-orange max-w-none">
          <div />
          <div className="mdx-content relative">
            {content}
          </div>
          <div />
        </div>

        <footer className="distill-grid mt-24">
          <div />
          <div className="border-t border-gray-100 pt-12 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center font-display font-bold text-orange-600">
                {siteProfile.authorInitial}
              </div>
              <div>
                <p className="font-bold text-gray-900">{siteProfile.name}</p>
                <p className="text-sm text-gray-500">{siteProfile.authorRole}</p>
              </div>
            </div>
          </div>
          <div />
        </footer>
      </article>
  );
}
