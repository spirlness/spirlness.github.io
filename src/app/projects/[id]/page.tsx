import type { Metadata } from "next";
import { getProjectDetailById, getAllProjects } from "@/lib/projects";
import { notFound } from "next/navigation";
import { Calendar, ExternalLink, Code, FileText, PlayCircle, ArrowLeft } from "lucide-react";
import { articleProse } from "@/components/mdx/MDXComponents";
import { siteProfile } from "@/content/site";
import { buildPageMetadata } from "@/lib/metadata";
import { ActionLink } from "@/components/ui/ActionLink";
import { SmartLink } from "@/components/ui/SmartLink";
import { Tag } from "@/components/ui/Tag";
import { ProjectMedia } from "@/components/projects/ProjectMedia";

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

  return (
    <article className="py-10 sm:py-16">
      <header className="max-w-4xl mx-auto px-6 lg:px-8 mb-12">
        <SmartLink
          href="/projects/"
          className="inline-flex items-center gap-2 text-sm font-display font-medium text-gray-400 hover:text-accent transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          All Projects
        </SmartLink>

        <div className="flex items-center gap-4 mb-6 text-sm text-gray-400 font-mono">
          <Calendar className="w-4 h-4" />
          <span>{project.date}</span>
          {project.tags && project.tags.length > 0 && (
            <>
              <span className="w-1 h-1 rounded-full bg-gray-200" />
              <div className="flex flex-wrap gap-2">
                {project.tags.map((tag) => (
                  <Tag key={tag}>{tag}</Tag>
                ))}
              </div>
            </>
          )}
        </div>

        <h1 className="font-display text-4xl md:text-5xl font-bold text-gray-900 mb-6">
          {project.title}
        </h1>

        <p className="text-xl text-gray-600 leading-relaxed">
          {project.description}
        </p>
      </header>

      {project.thumbnail && (
        <div className="max-w-5xl mx-auto px-6 lg:px-8 mb-16">
          <div className="relative aspect-video rounded-2xl overflow-hidden bg-gray-900">
            <ProjectMedia
              title={project.title}
              src={project.thumbnail}
              mediaType={project.mediaType}
              sizes="(max-width: 1024px) 100vw, 90vw"
              priority
            />
          </div>
        </div>
      )}

      <div className="max-w-3xl mx-auto px-6 lg:px-8">
        {content ? (
          <div className={articleProse}>{content}</div>
        ) : (
          <p className="text-gray-600 leading-relaxed text-lg">
            {project.description}
          </p>
        )}
      </div>

      <footer className="max-w-3xl mx-auto px-6 lg:px-8 mt-16 pt-12 border-t border-gray-100">
        <div className="flex flex-wrap gap-4">
          {project.links?.project && (
            <ActionLink href={project.links.project} icon={<ExternalLink className="w-4 h-4" />}>
              Project Page
            </ActionLink>
          )}
          {project.links?.code && (
            <ActionLink href={project.links.code} icon={<Code className="w-4 h-4" />}>
              Code
            </ActionLink>
          )}
          {project.links?.paper && (
            <ActionLink href={project.links.paper} icon={<FileText className="w-4 h-4" />}>
              Paper
            </ActionLink>
          )}
          {project.links?.demo && (
            <ActionLink href={project.links.demo} icon={<PlayCircle className="w-4 h-4" />}>
              Demo
            </ActionLink>
          )}
        </div>
      </footer>
    </article>
  );
}
