import type {
  ButtonHTMLAttributes,
  HTMLAttributes,
  ReactNode,
} from "react";

export type CircleIconSize = "xs" | "sm" | "md" | "lg";

const SIZE_CLASS: Record<CircleIconSize, string> = {
  xs: "h-7 w-7 text-sm",
  sm: "h-8 w-8",
  md: "h-12 w-12",
  lg: "h-16 w-16 text-sm",
};

type CommonProps = {
  size: CircleIconSize;
  className?: string;
  children: ReactNode;
};

type AsButton = CommonProps & { as?: "button" } & Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "className" | "children"
>;
type AsSpan = CommonProps & { as: "span" } & Omit<
  HTMLAttributes<HTMLSpanElement>,
  "className" | "children"
>;

export type CircleIconProps = AsButton | AsSpan;

/**
 * Shape primitive for the round ink-bordered icons/pills used across the
 * tracker (hero Over/Under badge, log-panel add button, row index badge,
 * edit/delete actions). Intentionally thin — callers bring their own
 * background/text color via Tailwind classes (e.g. `bg-hot text-cream`).
 */
export default function CircleIcon({
  size,
  className = "",
  children,
  ...rest
}: CircleIconProps) {
  const base =
    `grid place-items-center rounded-full border-2 border-ink ${SIZE_CLASS[size]} ${className}`.trim();

  if (rest.as === "span") {
    const { as: _as, ...spanRest } = rest;
    void _as;
    return (
      <span className={base} {...spanRest}>
        {children}
      </span>
    );
  }

  const { as: _as, ...btnRest } = rest;
  void _as;
  return (
    <button type="button" className={base} {...btnRest}>
      {children}
    </button>
  );
}
