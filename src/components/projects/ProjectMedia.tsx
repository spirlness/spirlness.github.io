import Image from "next/image";

export function ProjectMedia({
  title,
  src,
  mediaType,
  interactive = false,
  priority = false,
  sizes,
  className = "object-cover",
}: {
  title: string;
  src: string;
  mediaType?: "image" | "video";
  /**
   * Show native playback controls. Leave off (the default) whenever the media
   * is wrapped in a link: interactive controls nested inside an anchor are
   * invalid HTML, and their click/keyboard interaction would trigger the parent
   * navigation. Enable only where the media is not anchor-wrapped (detail page).
   */
  interactive?: boolean;
  priority?: boolean;
  sizes: string;
  className?: string;
}) {
  if (mediaType === "video") {
    return (
      <video
        src={src}
        aria-label={title}
        controls={interactive}
        preload="metadata"
        muted
        playsInline
        className="w-full h-full object-cover"
      />
    );
  }

  return (
    <Image
      src={src}
      alt={title}
      fill
      className={className}
      sizes={sizes}
      priority={priority}
    />
  );
}
