import fs from "fs";
import path from "path";
import { compileMDX } from "next-mdx-remote/rsc";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { SideNote } from "@/components/mdx/SideNote";
import { MathBlock } from "@/components/mdx/MathBlock";

const staticComponents = {
  SideNote,
  MathBlock,
};

const POSTS_PATH = path.join(process.cwd(), "content/posts");

export interface PostFrontmatter {
  title: string;
  date: string;
  excerpt: string;
  slug: string;
}

export async function getPostBySlug(slug: string) {
  const realSlug = slug.replace(/\.mdx$/, "");
  const filePath = path.join(POSTS_PATH, `${realSlug}.mdx`);
  const fileContent = fs.readFileSync(filePath, "utf8");

  const { content, frontmatter } = await compileMDX<PostFrontmatter>({
    source: fileContent,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    components: staticComponents as any,
    options: {
      parseFrontmatter: true,
      mdxOptions: {
        remarkPlugins: [remarkMath],
        rehypePlugins: [rehypeKatex],
      },
    },
  });

  return {
    content,
    frontmatter: {
      ...frontmatter,
      slug: realSlug,
    },
  };
}

export async function getAllPosts() {
  if (!fs.existsSync(POSTS_PATH)) {
    return [];
  }

  const files = fs.readdirSync(POSTS_PATH);
  const posts = await Promise.all(
    files
      .filter((file) => file.endsWith(".mdx"))
      .map(async (file) => {
        const slug = file.replace(/\.mdx$/, "");
        const { frontmatter } = await getPostBySlug(slug);
        return frontmatter;
      })
  );

  return posts.sort((a, b) => (new Date(b.date) > new Date(a.date) ? 1 : -1));
}
