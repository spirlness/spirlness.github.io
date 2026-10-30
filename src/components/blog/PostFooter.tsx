import { siteProfile } from "@/content/site";
import { SmartLink } from "@/components/ui/SmartLink";

interface PostLink {
  href: string;
  title: string;
}

interface DatedPostLink extends PostLink {
  date: string;
}

interface PostFooterProps {
  newer?: PostLink;
  older?: PostLink;
  related: DatedPostLink[];
}

export function PostFooter({ newer, older, related }: PostFooterProps) {
  return (
    <footer className="distill-grid mt-16 sm:mt-24">
      <div />
      <div className="border-t border-gray-100 pt-8 sm:pt-12 space-y-10">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center font-display font-bold text-orange-700">
            {siteProfile.authorInitial}
          </div>
          <div>
            <p className="font-bold text-gray-900">{siteProfile.name}</p>
            <p className="text-sm text-gray-600">{siteProfile.authorRole}</p>
          </div>
        </div>

        {(newer || older) && (
          <nav aria-label="Post navigation" className="flex justify-between gap-6 border-t border-gray-100 pt-6 text-sm">
            {older ? (
              <SmartLink
                href={older.href}
                aria-label={`Older post: ${older.title}`}
                className="group max-w-[45%] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-md p-1 -m-1"
              >
                <span className="block text-xs font-display font-bold tracking-widest text-gray-600 uppercase mb-1">
                  ← Older
                </span>
                <span className="font-medium text-gray-700 group-hover:text-accent group-focus-visible:text-accent transition-colors">
                  {older.title}
                </span>
              </SmartLink>
            ) : (
              <span />
            )}
            {newer ? (
              <SmartLink
                href={newer.href}
                aria-label={`Newer post: ${newer.title}`}
                className="group text-right max-w-[45%] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-md p-1 -m-1"
              >
                <span className="block text-xs font-display font-bold tracking-widest text-gray-600 uppercase mb-1">
                  Newer →
                </span>
                <span className="font-medium text-gray-700 group-hover:text-accent group-focus-visible:text-accent transition-colors">
                  {newer.title}
                </span>
              </SmartLink>
            ) : (
              <span />
            )}
          </nav>
        )}

        {related.length > 0 && (
          <div className="border-t border-gray-100 pt-6">
            <p className="text-xs font-display font-bold tracking-widest text-gray-600 uppercase mb-4">
              Related
            </p>
            <ul className="space-y-3">
              {related.map((post) => (
                <li key={post.href}>
                  <SmartLink
                    href={post.href}
                    className="group inline-flex flex-col gap-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-md p-1 -m-1"
                  >
                    <span className="font-medium text-gray-700 group-hover:text-accent group-focus-visible:text-accent transition-colors">
                      {post.title}
                    </span>
                    <span className="text-sm text-gray-600 font-mono">
                      {post.date}
                    </span>
                  </SmartLink>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      <div />
    </footer>
  );
}
