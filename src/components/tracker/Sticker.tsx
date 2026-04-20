import type { CSSProperties, ReactNode } from "react";

export type StickerProps = {
  children: ReactNode;
  /** Wobble-in animation delay in ms. Pass 0 to animate immediately; -1 to disable. */
  delay?: number;
  className?: string;
  as?: "section" | "article" | "div";
};

/**
 * Sticker-style card: thick ink border, rounded, hard offset shadow. The
 * wobble animation runs on mount unless `delay` is -1. Cards sit flat (no
 * tilt) so lines stay aligned and content stays easy to scan.
 *
 * Background is intentionally not set here -- pass `bg-cream` / `bg-lime` /
 * `bg-hot` (etc.) via `className` at the call site.
 */
export default function Sticker({
  children,
  delay = 0,
  className = "",
  as = "section",
}: StickerProps) {
  const animated = delay >= 0;
  const animationStyle: CSSProperties | undefined = animated
    ? {
        animation: `tracker-fade-up 500ms cubic-bezier(.2,.9,.3,1) ${delay}ms both`,
      }
    : undefined;
  const Tag = as;
  return (
    <Tag className={`tracker-sticker ${className}`.trim()} style={animationStyle}>
      {children}
    </Tag>
  );
}
