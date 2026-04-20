import type { CSSProperties } from "react";

type Shape = {
  top?: string;
  left?: string;
  right?: string;
  bottom?: string;
  size: number;
  color: string;
  rot: number;
};

const SHAPES: Shape[] = [
  { top: "6%", left: "4%", size: 22, color: "var(--color-hot)", rot: -12 },
  { top: "16%", right: "6%", size: 16, color: "var(--color-ocean)", rot: 18 },
  { top: "46%", left: "3%", size: 14, color: "var(--color-sun)", rot: 32 },
  { top: "62%", right: "5%", size: 26, color: "var(--color-lav)", rot: -22 },
  { bottom: "10%", left: "38%", size: 12, color: "var(--color-lime)", rot: 14 },
  { bottom: "18%", right: "24%", size: 18, color: "var(--color-sun)", rot: -8 },
];

/**
 * Fixed, decorative confetti floating behind the main UI. Purely visual:
 * `pointer-events-none` and `aria-hidden`.
 */
export default function Confetti() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0">
      {SHAPES.map((s, i) => {
        const style: CSSProperties = {
          top: s.top,
          left: s.left,
          right: s.right,
          bottom: s.bottom,
          width: s.size,
          height: s.size,
          background: s.color,
          ["--tracker-rot" as string]: `${s.rot}deg`,
          transform: `rotate(${s.rot}deg)`,
          animation: `tracker-drift ${6 + (i % 3)}s ease-in-out ${i * 400}ms infinite`,
          opacity: 0.85,
        };
        return (
          <span
            key={i}
            className="absolute block rounded-[5px] border-2 border-ink"
            style={style}
          />
        );
      })}
    </div>
  );
}
