export type StatusStampProps = {
  /** Live message; falsy values render a non-breaking space to hold the line. */
  message: string;
  /** When true, tints the message hot-pink (used for validation + submission errors). */
  isError: boolean;
  /** Optional DOM id — helpful when other controls use `aria-errormessage` / scroll anchors. */
  id?: string;
  className?: string;
};

/**
 * Italic, display-font paragraph used across the tracker for transient
 * status messages (`aria-live="polite"`). Holds a minimum height so the
 * surrounding layout doesn't shift when the message appears/disappears.
 */
export default function StatusStamp({
  message,
  isError,
  id,
  className = "",
}: StatusStampProps) {
  const tone = isError ? "text-hot" : "text-muted";
  return (
    <p
      id={id}
      role="status"
      aria-live="polite"
      className={`min-h-[1.2em] text-center font-display italic text-display-xs ${tone} ${className}`.trim()}
    >
      {message || "\u00a0"}
    </p>
  );
}
