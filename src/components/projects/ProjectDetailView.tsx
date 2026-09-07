import type { ReactNode } from "react";
import { Calendar, ExternalLink, Code, FileText, PlayCircle, ArrowLeft } from "lucide-react";
import type { ProjectFrontmatter } from "@/lib/projects";
import { articleProse } from "@/components/mdx/MDXComponents";
import { ActionLink } from "@/components/ui/ActionLink";
import { SmartLink } from "@/components/ui/SmartLink";
import { Tag } from "@/components/ui/Tag";
import { ProjectMedia } from "@/components/projects/ProjectMedia";

interface ProjectDetailViewProps {
  project: ProjectFrontmatter;
  content: ReactNode | null;
}

interface ProjectActionLink {
  href: string;
  label: string;
  icon: ReactNode;
}

export function ProjectDetailView({
  project,
  content,
}: ProjectDetailViewProps) {
  const actionLinks: ProjectActionLink[] = [
    ...(project.links?.project
      ? [{
          href: project.links.project,
          label: "Project Page",
          icon: <ExternalLink className="w-4 h-4" />,
        }]
      : []),
    ...(project.links?.code
      ? [{
          href: project.links.code,
          label: "Code",
          icon: <Code className="w-4 h-4" />,
        }]
      : []),
    ...(project.links?.paper
      ? [{
          href: project.links.paper,
          label: "Paper",
          icon: <FileText className="w-4 h-4" />,
        }]
      : []),
    ...(project.links?.demo
      ? [{
          href: project.links.demo,
          label: "Demo",
          icon: <PlayCircle className="w-4 h-4" />,
        }]
      : []),
  ];

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
        {content !== null && content !== undefined ? (
          <div className={articleProse}>{content}</div>
        ) : (
          <p className="text-gray-600 leading-relaxed text-lg">
            {project.description}
          </p>
        )}
      </div>

      <footer className="max-w-3xl mx-auto px-6 lg:px-8 mt-16 pt-12 border-t border-gray-100">
        <div className="flex flex-wrap gap-4">
          {actionLinks.map(({ href, label, icon }) => (
            <ActionLink key={href} href={href} icon={icon}>
              {label}
            </ActionLink>
          ))}
        </div>
      </footer>
    </article>
  );
}
