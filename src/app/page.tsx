import type { Metadata } from "next";
import { ArrowDown, ArrowRight, BookOpen } from "lucide-react";
import { siteProfile } from "@/content/site";
import { getAllUpdates, UpdateIcon } from "@/lib/updates";
import { updateIconClassName, updateIconComponents } from "@/lib/update-icons";
import { isExternalHref, isSafeHref } from "@/lib/links";
import { JsonLd } from "@/components/meta/JsonLd";
import { buildPageMetadata } from "@/lib/metadata";
import { SmartLink } from "@/components/ui/SmartLink";
import { Tag } from "@/components/ui/Tag";
import { getAllProjects, projectHref } from "@/lib/projects";
import { ProjectMedia } from "@/components/projects/ProjectMedia";
import { getAllPublications } from "@/lib/bibtex";
import { getAllPostFrontmatter, postHref } from "@/lib/posts";
import { ResearchMap } from "@/components/home/ResearchMap";

function UpdateTimelineIcon({ icon }: { icon: UpdateIcon }) {
  const Icon = updateIconComponents[icon];
  return <Icon className={updateIconClassName[icon]} />;
}

function SectionHeading({ title, href }: { title: string; href?: string }) {
  return (
    <div className="mb-8 flex items-baseline justify-between gap-4 border-b border-stone-200 pb-4 font-sans">
      <h2 className="text-xl font-medium tracking-tight text-stone-900">{title}</h2>
      {href && (
        <SmartLink href={href} className="group inline-flex shrink-0 items-center gap-2 text-sm font-medium text-accent hover:text-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-4">
          View all <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
        </SmartLink>
      )}
    </div>
  );
}

export const metadata: Metadata = buildPageMetadata({
  title: siteProfile.title,
  description: siteProfile.description,
  path: "/",
});

export default function Home() {
  const updates = getAllUpdates();
  const projects = getAllProjects().slice(0, 3);
  const publications = getAllPublications().slice(0, 3);
  const posts = getAllPostFrontmatter().slice(0, 3);

  return (
    <div className="mx-auto max-w-[1180px] px-5 sm:px-8">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Person",
          name: siteProfile.name,
          url: siteProfile.url,
          jobTitle: siteProfile.authorRole,
          description: siteProfile.researchSummary,
          sameAs: siteProfile.links.map((l) => l.href),
        }}
      />
      <main id="main-content" tabIndex={-1}>
        <section className="grid items-center gap-12 py-14 sm:py-20 lg:grid-cols-[1.03fr_0.97fr] lg:gap-16 lg:py-24">
          <div>
            <p className="mb-7 font-sans text-base text-accent">
              {siteProfile.name} <span className="mx-2 text-stone-300" aria-hidden="true">/</span> {siteProfile.authorRole}
            </p>
            <h1 className="max-w-[12ch] font-display text-[3.4rem] leading-[1.04] tracking-[-0.025em] text-stone-950 sm:text-[4.5rem] lg:text-[4.65rem]">
              {siteProfile.heroTitle.join(" ")}
            </h1>
            <p className="mt-7 max-w-xl text-[1.2rem] leading-[1.8] text-stone-600">
              {siteProfile.researchSummary}
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-3 font-sans">
              <SmartLink href="/projects/" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#153635] px-6 text-sm font-medium text-white transition-colors hover:bg-[#214b48] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-4">
                Explore my research <ArrowRight className="size-4" aria-hidden="true" />
              </SmartLink>
              <SmartLink href="/publications/" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-stone-300 px-6 text-sm font-medium text-stone-800 transition-colors hover:border-stone-500 hover:bg-stone-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-4">
                <BookOpen className="size-4" aria-hidden="true" /> Read publications
              </SmartLink>
            </div>
            <div className="mt-10 flex flex-wrap gap-x-6 gap-y-3 border-t border-stone-200 pt-5 font-sans text-sm text-stone-600">
              <span>Find me on</span>
              {siteProfile.links.map((link) => (
                <SmartLink key={link.href} href={link.href} className="font-medium text-stone-800 underline decoration-stone-300 underline-offset-4 transition-colors hover:text-accent hover:decoration-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
                  {link.label}
                </SmartLink>
              ))}
            </div>
          </div>
          <ResearchMap />
        </section>

        <div className="grid gap-3 border-y border-stone-200 py-5 sm:grid-cols-[auto_1fr_auto] sm:items-center sm:gap-5">
          <span className="font-sans text-sm font-medium text-accent">Current focus</span>
          <p className="max-w-3xl text-base leading-relaxed text-stone-700">
            {siteProfile.currentWork}
          </p>
          <a href="#featured-research" aria-label="Explore featured research" className="hidden size-9 items-center justify-center rounded-full border border-stone-200 text-stone-500 transition-colors hover:border-accent hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent sm:inline-flex">
            <ArrowDown className="size-4" aria-hidden="true" />
          </a>
        </div>

        {projects.length > 0 && (
          <section id="featured-research" className="scroll-mt-28 py-16 sm:py-20">
            <SectionHeading title="Featured research" href="/projects/" />
            <div className={`grid gap-x-8 gap-y-12 ${projects.length > 1 ? "md:grid-cols-2" : ""}`}>
              {projects.map((project, index) => (
                <article key={project.id} className="group min-w-0">
                  <SmartLink href={projectHref(project.id)} className="block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-4">
                    <div className="relative mb-5 aspect-[16/9] overflow-hidden rounded-xl bg-[#153635]">
                      <ProjectMedia title={project.title} src={project.thumbnail} mediaType={project.mediaType} priority={index === 0} className="object-cover transition-transform duration-500 group-hover:scale-[1.025]" sizes="(max-width: 768px) calc(100vw - 40px), 530px" />
                    </div>
                    <div className="mb-3 flex items-center justify-between gap-4 font-sans text-sm text-stone-500">
                      <span>{project.tags?.slice(0, 2).join(" / ")}</span>
                      <time dateTime={project.date}>{project.date}</time>
                    </div>
                    <h3 className="font-display text-[1.85rem] leading-tight text-stone-900 transition-colors group-hover:text-accent">{project.title}</h3>
                    <p className="mt-3 leading-relaxed text-stone-600">{project.description}</p>
                    <span className="mt-4 inline-flex items-center gap-2 font-sans text-sm font-medium text-stone-800">
                      View project <ArrowRight className="size-4 text-accent transition-transform group-hover:translate-x-1" aria-hidden="true" />
                    </span>
                  </SmartLink>
                </article>
              ))}
            </div>
          </section>
        )}

        <section className="border-t border-stone-200 py-16 sm:py-20">
          <SectionHeading title="Selected publications" href="/publications/" />
          <div>
            {publications.map((publication) => (
              <article key={publication.id} className="grid gap-3 border-b border-stone-100 py-6 last:border-0 sm:grid-cols-[4.5rem_1fr] sm:gap-5">
                <span className="font-sans text-sm text-stone-500 sm:pt-1">{publication.year}</span>
                <div>
                  <h3 className="font-display text-2xl leading-snug text-stone-900">{publication.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-stone-600">{publication.authors}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-stone-600">
                    <span className="italic">{publication.journal || publication.booktitle}</span>
                    {publication.verification === "unverified" && (
                      <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 font-sans text-xs text-amber-900">Details pending verification</span>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="border-t border-stone-200 py-16 sm:py-20">
          <SectionHeading title="Research interests" />
          <div className="grid gap-x-10 gap-y-10 md:grid-cols-3">
            {siteProfile.focusAreas.map((area) => (
              <div key={area.title}>
                <h3 className="font-display text-2xl leading-tight text-stone-900">{area.title}</h3>
                <p className="mt-3 text-[0.9375rem] leading-relaxed text-stone-600">{area.description}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="grid gap-16 border-t border-stone-200 py-16 sm:py-20 lg:grid-cols-[1.15fr_0.85fr] lg:gap-20">
          {posts.length > 0 && (
            <section>
              <SectionHeading title="Recent writing" href="/blog/" />
              <div className="space-y-7">
                {posts.map((post) => (
                  <article key={post.slug}>
                    <SmartLink href={postHref(post.slug)} className="group block rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-4">
                      <time className="font-sans text-sm text-stone-500" dateTime={post.date}>{post.date}</time>
                      <h3 className="mt-2 font-display text-2xl leading-tight text-stone-900 transition-colors group-hover:text-accent">{post.title}</h3>
                      <p className="mt-2 leading-relaxed text-stone-600">{post.excerpt}</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {post.tags.map((tag) => <Tag key={tag}>{tag}</Tag>)}
                      </div>
                    </SmartLink>
                  </article>
                ))}
              </div>
            </section>
          )}

          <section>
            <SectionHeading title="Latest updates" />
            <ol>
              {updates.slice(0, 5).map((update) => (
                <li key={`${update.date}-${update.content}`} className="relative flex gap-4 border-b border-stone-100 py-4 first:pt-0 last:border-0">
                  <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full border border-stone-200 bg-white">
                    <UpdateTimelineIcon icon={update.icon} />
                  </div>
                  <div>
                    <time className="font-sans text-xs text-stone-500" dateTime={update.date}>{update.date}</time>
                    {isSafeHref(update.link) ? (
                      <SmartLink href={update.link} {...(isExternalHref(update.link) ? { target: "_blank", rel: "noopener noreferrer" } : {})} className="mt-1 block text-[0.9375rem] leading-relaxed text-stone-700 transition-colors hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
                        {update.content}
                      </SmartLink>
                    ) : (
                      <p className="mt-1 text-[0.9375rem] leading-relaxed text-stone-700">{update.content}</p>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </section>
        </div>

        <section className="relative overflow-hidden rounded-2xl bg-[#153635] px-6 py-10 text-white sm:px-10 sm:py-12">
          <div className="max-w-2xl">
            <h2 className="font-display text-3xl leading-tight sm:text-4xl">Let&apos;s explore a problem together.</h2>
            <p className="mt-4 leading-relaxed text-white/75">{siteProfile.contactIntro}</p>
            <div className="mt-7 flex flex-wrap gap-x-6 gap-y-3 font-sans text-sm font-medium">
              {siteProfile.links.map((link) => (
                <SmartLink key={link.href} href={link.href} className="inline-flex items-center rounded-sm text-white underline decoration-white/35 underline-offset-4 transition-colors hover:decoration-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-4 focus-visible:ring-offset-[#153635]">
                  {link.label}
                </SmartLink>
              ))}
            </div>
          </div>
          <div className="pointer-events-none absolute -right-14 -top-24 size-72 rounded-full border border-white/10" aria-hidden="true" />
          <div className="pointer-events-none absolute -right-3 -top-12 size-44 rounded-full border border-[#e6b197]/20" aria-hidden="true" />
        </section>
      </main>
    </div>
  );
}
