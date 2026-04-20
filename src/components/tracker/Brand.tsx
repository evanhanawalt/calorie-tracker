export type BrandProps = {
  /** Tagline rendered below the wordmark. Omit for a compact header. */
  tagline?: string;
  className?: string;
};

/**
 * Wordmark: "calorie tracker" lockup in the display font. Used in the
 * tracker nav, landing hero, and settings header.
 */
export default function Brand({ tagline, className = "" }: BrandProps) {
  return (
    <div className={`leading-none ${className}`.trim()}>
      <p className="font-display text-display-lg leading-none">
        <span className="text-hot">calorie</span> <span>tracker</span>
      </p>
      {tagline ? (
        <p className="text-label mt-1 text-muted">{tagline}</p>
      ) : null}
    </div>
  );
}
