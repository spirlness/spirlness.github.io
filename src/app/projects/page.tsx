import type { Metadata } from "next";
import { getAllProjects, projectHref, type ProjectFrontmatter } from "@/lib/projects";
import { buildPageMetadata } from "@/lib/metadata";
import { Calendar } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { SmartLink } from "@/components/ui/SmartLink";
import { Tag } from "@/components/ui/Tag";
import { ProjectMedia } from "@/components/projects/ProjectMedia";

export const metadata: Metadata = buildPageMetadata({
  title: "Projects",
  description: "Independent research projects and open-source tools.",
  path: "/projects/",
});

function ProjectCard({ project }: { project: ProjectFrontmatter }) {
  return (
    <SmartLink
      href={projectHref(project.id)}
      className="group block border-b border-gray-100 pb-10 last:border-0 hover:border-orange-100 transition-colors"
    >
      <div className="relative aspect-video bg-gray-900 overflow-hidden rounded-lg mb-5">
        <ProjectMedia
          title={project.title}
          src={project.thumbnail}
          mediaType={project.mediaType}
          className="object-cover group-hover:scale-[1.02] transition-transform duration-500"
          sizes="(max-width: 800px) 100vw, 800px"
        />
      </div>
      <div className="flex items-center gap-3 text-sm text-gray-400 font-mono mb-3">
        <Calendar className="w-3.5 h-3.5" />
        <span>{project.date}</span>
      </div>
      <h2 className="text-2xl font-display font-bold text-gray-900 mb-3 group-hover:text-accent transition-colors">
        {project.title}
      </h2>
      <p className="text-gray-600 leading-relaxed mb-4">
        {project.description}
      </p>
      {project.tags && project.tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {project.tags.map((tag) => (
            <Tag key={tag}>{tag}</Tag>
          ))}
        </div>
      )}
    </SmartLink>
  );
}

export default async function ProjectsPage() {
  const projects = getAllProjects();

  return (
    <main className="distill-grid py-16">
      <div />
      <div className="px-6 lg:px-0">
        <PageHeader
          title="Projects"
          description="Independent research projects and open-source tools."
        />

        {projects.length > 0 ? (
          <div className="space-y-12">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        ) : (
          <EmptyState>No projects found yet. Check back soon!</EmptyState>
        )}
      </div>
      <div />
    </main>
  );
}
