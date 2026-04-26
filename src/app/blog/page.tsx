import Link from "next/link";
import { getAllPosts } from "@/lib/posts";

export default async function BlogPage() {
  const posts = await getAllPosts();

  return (
    <div className="distill-grid py-16">
      <div />
      <main>
        <header className="mb-16">
          <h1 className="font-display text-5xl font-bold mb-4 text-gray-900">Blog</h1>
          <p className="text-xl text-gray-500 font-serif italic">
            Thoughts on physics, computing, and everything in between.
          </p>
        </header>

        <div className="space-y-16">
          {posts.length > 0 ? (
            posts.map((post) => (
              <article key={post.slug} className="group">
                <Link href={`/blog/${post.slug}`}>
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
                  <div className="mt-4 flex items-center gap-1 text-sm font-display font-bold text-accent opacity-0 group-hover:opacity-100 transition-opacity">
                    READ MORE <span>→</span>
                  </div>
                </Link>
              </article>
            ))
          ) : (
            <div className="py-12 text-center border-2 border-dashed border-gray-100 rounded-xl">
              <p className="text-gray-400 italic">No posts found yet. Check back soon!</p>
            </div>
          )}
        </div>
      </main>
      <div />
    </div>
  );
}
