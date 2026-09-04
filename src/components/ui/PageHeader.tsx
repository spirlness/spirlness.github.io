export function PageHeader({
  title,
  description,
  eyebrow,
  variant = "index",
}: {
  title: string;
  description: string;
  eyebrow?: string;
  variant?: "index" | "tag" | "compact";
}) {
  const compact = variant === "compact";
  const titleClass =
    variant === "compact"
      ? "text-4xl"
      : variant === "tag"
        ? "text-4xl sm:text-5xl"
        : "text-5xl";
  const descriptionClass =
    variant === "compact"
      ? "text-lg text-gray-600 max-w-2xl"
      : variant === "tag"
        ? "text-lg text-gray-500"
        : "text-xl text-gray-500 font-serif italic";

  return (
    <header className={compact ? "mb-12" : "mb-16"}>
      {eyebrow && (
        <p className="text-sm font-display font-bold tracking-widest text-accent uppercase mb-3">
          {eyebrow}
        </p>
      )}
      <h1
        className={`font-display font-bold text-gray-900 mb-4 ${titleClass}`}
      >
        {title}
      </h1>
      <p className={descriptionClass}>{description}</p>
    </header>
  );
}
