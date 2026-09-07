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
          <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center font-display font-bold text-orange-600">
            {siteProfile.authorInitial}
          </div>
          <div>
            <p className="font-bold text-gray-900">{siteProfile.name}</p>
            <p className="text-sm text-gray-500">{siteProfile.authorRole}</p>
          </div>
        </div>

        {(newer || older) && (
          <div className="flex justify-between gap-6 border-t border-gray-100 pt-6 text-sm">
            {older ? (
              <SmartLink href={older.href} className="group max-w-[45%]">
                <span className="block text-xs font-display font-bold tracking-widest text-gray-400 uppercase mb-1">
                  Older
                </span>
                <span className="font-medium text-gray-700 group-hover:text-accent transition-colors">
                  {older.title}
                </span>
              </SmartLink>
            ) : (
              <span />
            )}
            {newer ? (
              <SmartLink href={newer.href} className="group text-right max-w-[45%]">
                <span className="block text-xs font-display font-bold tracking-widest text-gray-400 uppercase mb-1">
                  Newer
                </span>
                <span className="font-medium text-gray-700 group-hover:text-accent transition-colors">
                  {newer.title}
                </span>
              </SmartLink>
            ) : (
              <span />
            )}
          </div>
        )}

        {related.length > 0 && (
          <div className="border-t border-gray-100 pt-6">
            <p className="text-xs font-display font-bold tracking-widest text-gray-400 uppercase mb-4">
              Related
            </p>
            <ul className="space-y-3">
              {related.map((post) => (
                <li key={post.href}>
                  <SmartLink
                    href={post.href}
                    className="group inline-flex flex-col gap-0.5"
                  >
                    <span className="font-medium text-gray-700 group-hover:text-accent transition-colors">
                      {post.title}
                    </span>
                    <span className="text-sm text-gray-400 font-mono">
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
