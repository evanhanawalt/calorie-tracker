import { useEffect, useId, useRef, type ReactNode } from "react";

export type TrackerDialogProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  /** Shown below the title; linked for accessibility when provided. */
  description?: ReactNode;
  /** Extra body content (e.g. form fields). */
  children?: ReactNode;
  primaryLabel: string;
  onPrimary: () => void;
  primaryDisabled?: boolean;
  primaryVariant?: "default" | "danger";
  secondaryLabel?: string;
  /** Defaults to `onClose`. */
  onSecondary?: () => void;
};

/**
 * Tracker-style modal. Uses the native `<dialog>` element (so Escape,
 * focus-trap and backdrop clicks keep working), then swaps chrome for a
 * sticker card with a ribbon-style pill above the title.
 *
 * `primaryVariant="danger"` tints the pill and confirm button hot-pink.
 */
export default function TrackerDialog({
  open,
  onClose,
  title,
  description,
  children,
  primaryLabel,
  onPrimary,
  primaryDisabled = false,
  primaryVariant = "default",
  secondaryLabel = "Cancel",
  onSecondary,
}: TrackerDialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open) {
      if (!el.open) el.showModal();
    } else {
      el.close();
    }
  }, [open]);

  const handleSecondary = () => {
    (onSecondary ?? onClose)();
  };

  const danger = primaryVariant === "danger";
  const pillClass = danger ? "bg-hot text-cream" : "bg-lav";
  const primaryClass = danger
    ? "bg-hot text-cream"
    : "bg-lime text-ink";

  return (
    <dialog
      ref={ref}
      className="fixed left-1/2 top-1/2 z-50 max-h-[min(90vh,32rem)] w-[min(calc(100vw-2rem),26rem)] max-w-[calc(100vw-2rem)] -translate-x-1/2 -translate-y-1/2 border-0 bg-transparent p-0 backdrop:bg-ink/45"
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="tracker-sticker relative bg-cream p-5 md:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <span
          className={`tracker-chip mb-2 text-chip uppercase tracking-chip ${pillClass}`}
        >
          {danger ? "Warning" : "Confirm"}
        </span>
        <h2
          id={titleId}
          className="font-display text-display-md leading-tight"
        >
          {title}
        </h2>
        {description ? (
          <p
            id={descriptionId}
            className="mt-2 text-sm leading-relaxed text-muted"
          >
            {description}
          </p>
        ) : null}
        {children ? <div className="mt-4">{children}</div> : null}
        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <button
            type="button"
            className="tracker-btn bg-paper"
            onClick={handleSecondary}
          >
            {secondaryLabel}
          </button>
          <button
            type="button"
            className={`tracker-btn ${primaryClass}`}
            disabled={primaryDisabled}
            onClick={onPrimary}
          >
            {primaryLabel}
          </button>
        </div>
      </div>
    </dialog>
  );
}
