import type { Metadata } from "next";
import { getAllProjects, projectHref, type ProjectFrontmatter } from "@/lib/projects";
import { Calendar } from "lucide-react";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Projects",
};

function ProjectCard({ project }: { project: ProjectFrontmatter }) {
  return (
    <a
      href={projectHref(project.id)}
      className="group block border-b border-gray-100 pb-10 last:border-0 hover:border-orange-100 transition-colors"
    >
      <div className="relative aspect-video bg-gray-900 overflow-hidden rounded-lg mb-5">
        {project.mediaType === "video" ? (
          <video
            src={project.thumbnail}
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover"
          />
        ) : (
          <Image
            src={project.thumbnail}
            alt={project.title}
            fill
            className="object-cover group-hover:scale-[1.02] transition-transform duration-500"
            sizes="(max-width: 800px) 100vw, 800px"
          />
        )}
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
            <span
              key={tag}
              className="text-xs font-display font-medium text-orange-600 bg-orange-50 px-2.5 py-1 rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </a>
  );
}

export default async function ProjectsPage() {
  const projects = getAllProjects();

  return (
    <main className="distill-grid py-16">
      <div />
      <div className="px-6 lg:px-0">
        <header className="mb-16">
          <h1 className="font-display text-5xl font-bold text-gray-900 mb-4">
            Projects
          </h1>
          <p className="text-xl text-gray-500 font-serif italic">
            Independent research projects and open-source tools.
          </p>
        </header>

        {projects.length > 0 ? (
          <div className="space-y-12">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        ) : (
          <div className="py-24 text-center border-2 border-dashed border-gray-100 rounded-xl">
            <p className="text-gray-400 italic">No projects found yet. Check back soon!</p>
          </div>
        )}
      </div>
      <div />
    </main>
  );
}
