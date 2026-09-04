import Image from "next/image";

export function ProjectMedia({
  title,
  src,
  mediaType,
  priority = false,
  sizes,
  className = "object-cover",
}: {
  title: string;
  src: string;
  mediaType?: "image" | "video";
  priority?: boolean;
  sizes: string;
  className?: string;
}) {
  if (mediaType === "video") {
    return (
      <video
        src={src}
        aria-label={title}
        autoPlay
        loop
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
