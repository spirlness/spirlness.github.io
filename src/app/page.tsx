import { Calendar, Award, BookOpen, GraduationCap, Folder, FileText, Newspaper, ExternalLink } from "lucide-react";
import { siteProfile } from "@/content/site";
import { getAllUpdates, UpdateIcon } from "@/lib/updates";
import { isExternalHref, isSafeHref } from "@/lib/links";

const updateIcons: Record<UpdateIcon, React.ReactNode> = {
  award: <Award className="w-4 h-4 text-orange-500" />,
  book: <BookOpen className="w-4 h-4 text-blue-500" />,
  graduation: <GraduationCap className="w-4 h-4 text-purple-500" />,
  project: <Folder className="w-4 h-4 text-green-500" />,
  publication: <FileText className="w-4 h-4 text-red-500" />,
  blog: <Newspaper className="w-4 h-4 text-indigo-500" />,
};

export default function Home() {
  const updates = getAllUpdates();
  return (
    <div className="distill-grid py-10 sm:py-16">
      <div />
      <main>
        <section className="mb-24">
          <p className="font-display text-sm font-bold tracking-widest text-accent uppercase mb-5">
            {siteProfile.name}
          </p>
          <h1 className="font-display text-4xl sm:text-6xl font-bold tracking-tight leading-tight mb-8 text-gray-900">
            {siteProfile.heroTitle[0]} <br />
            {siteProfile.heroTitle[1]}
          </h1>
          <div className="text-xl leading-relaxed text-gray-700 space-y-6 max-w-2xl">
            <p>
              {siteProfile.researchSummary}
            </p>
            <p>
              {siteProfile.currentWork}
            </p>
          </div>
        </section>

        <section className="mb-24">
          <h2 className="font-display text-2xl font-bold mb-12 tracking-widest text-gray-400 uppercase">
            Focus Areas
          </h2>
          <div className="grid grid-cols-1 gap-10">
            {siteProfile.focusAreas.map((area) => (
              <div key={area.title} className="border-l-2 border-orange-100 pl-6">
                <h3 className="font-display text-xl font-bold text-gray-900 mb-2">
                  {area.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {area.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-24">
          <h2 className="font-display text-2xl font-bold mb-12 flex items-center gap-3 tracking-widest text-gray-400 uppercase">
            <Calendar className="w-5 h-5" />
            Latest Updates
          </h2>
          <div className="space-y-12">
            {updates.map((update, index) => (
              <div key={`${update.date}-${update.content}`} className="flex gap-4 sm:gap-8 relative group">
                {index !== updates.length - 1 && (
                  <div className="absolute left-[18px] top-8 bottom-[-48px] w-px bg-gray-100 group-hover:bg-orange-100 transition-colors" />
                )}
                <div className="flex-none w-9 h-9 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center relative z-10 group-hover:border-orange-200 transition-colors">
                  {updateIcons[update.icon]}
                </div>
                <div className="pt-1.5 pb-2">
                  <span className="text-sm font-mono text-gray-400 mb-2 block tracking-tighter">
                    {update.date}
                  </span>
                  {isSafeHref(update.link) ? (
                    <a
                      href={update.link}
                      {...(isExternalHref(update.link)
                        ? { target: "_blank", rel: "noopener noreferrer" }
                        : {})}
                      className="inline-flex items-center gap-1.5 text-lg text-gray-700 leading-snug hover:text-accent transition-colors group/link"
                    >
                      {update.content}
                      {isExternalHref(update.link) && (
                        <ExternalLink className="w-3.5 h-3.5 text-gray-300 group-hover/link:text-accent/70 transition-colors" />
                      )}
                    </a>
                  ) : (
                    <p className="text-lg text-gray-700 leading-snug">
                      {update.content}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="p-6 sm:p-12 bg-gray-50 rounded-2xl border border-gray-100">
          <h3 className="font-display text-xl font-bold mb-4">Contact & Information</h3>
          <p className="text-gray-600 mb-8 leading-relaxed">
            {siteProfile.contactIntro}
          </p>
          <div className="flex flex-wrap gap-6 font-display text-sm font-medium text-gray-500">
            {siteProfile.links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-accent underline underline-offset-4 decoration-gray-200"
              >
                {link.label}
              </a>
            ))}
          </div>
        </section>
      </main>
      <div />
    </div>
  );
}
