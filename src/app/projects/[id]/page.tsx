import type { Metadata } from "next";
import { getProjectDetailById, getAllProjects } from "@/lib/projects";
import { notFound } from "next/navigation";
import { siteProfile } from "@/content/site";
import { buildPageMetadata } from "@/lib/metadata";
import { ProjectDetailView } from "@/components/projects/ProjectDetailView";

interface ProjectPageProps {
  params: Promise<{
    id: string;
  }>;
}

// Block dynamic route generation so ungenerated IDs 404 instead of
// attempting dynamic rendering (which `output: "export"` cannot serve).
export const dynamicParams = false;

/**
 * Static params for all project JSON files.
 */
export async function generateStaticParams() {
  const projects = getAllProjects();
  return projects.map((project) => ({
    id: project.id,
  }));
}

export async function generateMetadata({ params }: ProjectPageProps): Promise<Metadata> {
  const { id } = await params;
  try {
    const { project } = await getProjectDetailById(id);
    return buildPageMetadata({
      title: project.title,
      description: project.description,
      path: `/projects/${project.id}/`,
    });
  } catch {
    return buildPageMetadata({
      title: "Project",
      description: siteProfile.description,
      path: "/projects/",
    });
  }
}

export default async function ProjectDetailPage({ params }: ProjectPageProps) {
  const { id } = await params;

  let result: Awaited<ReturnType<typeof getProjectDetailById>> | undefined;
  try {
    result = await getProjectDetailById(id);
  } catch (error) {
    console.error("Error loading project:", error);
    notFound();
  }

  if (!result) {
    notFound();
  }

  const { project, content } = result;

  return <ProjectDetailView project={project} content={content} />;
}
