import { useEffect, useId, useRef, type ReactNode } from "react";
import { GOOGLE_SIGN_IN_BUTTON_CLASSNAME } from "./googleSignInBranding";

export type TrackerDialogProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  /** Shown below the title; linked for accessibility when provided. */
  description?: ReactNode;
  /** Extra body content (e.g. form fields). */
  children?: ReactNode;
  primaryLabel: ReactNode;
  onPrimary: () => void;
  primaryDisabled?: boolean;
  /** `google` uses Sign in with Google light-theme styles (branding guidelines). */
  primaryVariant?: "default" | "danger" | "google";
  secondaryLabel?: string;
  /** Defaults to `onClose`. */
  onSecondary?: () => void;
};

/**
 * Shared modal UI for confirmations and simple prompts (native `<dialog>`).
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

  const primaryClass =
    primaryVariant === "danger"
      ? "rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      : primaryVariant === "google"
        ? `font-google-sign-in ${GOOGLE_SIGN_IN_BUTTON_CLASSNAME} min-w-[12.5rem]`
        : "rounded-md bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <dialog
      ref={ref}
      className="fixed left-1/2 top-1/2 z-50 max-h-[min(90vh,32rem)] w-[min(calc(100vw-2rem),24rem)] max-w-[calc(100vw-2rem)] -translate-x-1/2 -translate-y-1/2 border-0 bg-transparent p-0 backdrop:bg-black/40"
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
        className="rounded-xl border border-slate-200 bg-white p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id={titleId} className="text-lg font-semibold text-slate-900">
          {title}
        </h2>
        {description ? (
          <p
            id={descriptionId}
            className="mt-2 text-sm text-slate-600 leading-relaxed"
          >
            {description}
          </p>
        ) : null}
        {children ? <div className="mt-4">{children}</div> : null}
        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2"
            onClick={handleSecondary}
          >
            {secondaryLabel}
          </button>
          <button
            type="button"
            className={primaryClass}
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
