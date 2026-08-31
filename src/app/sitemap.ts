import type { MetadataRoute } from "next";
import { siteProfile } from "@/content/site";
import { getAllPostFrontmatter } from "@/lib/posts";
import { getAllProjects, projectHref } from "@/lib/projects";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteProfile.url;
  const posts = getAllPostFrontmatter();
  const projects = getAllProjects();

  return [
    { url: `${base}/`, changeFrequency: "monthly", priority: 1 },
    { url: `${base}/projects/`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/publications/`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/blog/`, changeFrequency: "weekly", priority: 0.8 },
    ...posts.map((post) => ({
      url: `${base}/blog/${post.slug}/`,
      lastModified: post.date,
      changeFrequency: "yearly" as const,
      priority: 0.6,
    })),
    ...projects.map((project) => ({
      url: `${base}${projectHref(project.id)}`,
      lastModified: project.date,
      changeFrequency: "yearly" as const,
      priority: 0.6,
    })),
    { url: `${base}/feed.xml`, changeFrequency: "weekly", priority: 0.3 },
  ];
}
