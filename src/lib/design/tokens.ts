import type { Shape, Tokens, Tone, Typography } from "./types";

/**
 * Mobile-first sizing tokens.
 *
 * Every size is a clamp() so a generated page can never produce a heading that
 * overflows a 320px viewport, and never collapses to unreadable text on desktop.
 */
export function buildTokens(type: Typography, shape: Shape, tone: Tone): Tokens {
  const s = clampNumber(type.scale, 0.92, 1.14);
  const density = clampNumber(tone.density, 0, 1);

  const h1Min = round(1.85 * s);
  const h1Max = round(3.9 * s);
  const h2Min = round(1.45 * s);
  const h2Max = round(2.6 * s);
  const h3Min = round(1.05 * s);
  const h3Max = round(1.3 * s);

  const padMin = Math.round(shape.sectionPadding * 0.52);
  const padMax = shape.sectionPadding;

  return {
    h1: `clamp(${h1Min}rem, ${round(6.2 * s)}vw + 0.6rem, ${h1Max}rem)`,
    h2: `clamp(${h2Min}rem, ${round(3.6 * s)}vw + 0.5rem, ${h2Max}rem)`,
    h3: `clamp(${h3Min}rem, ${round(1.4 * s)}vw + 0.7rem, ${h3Max}rem)`,
    body: `clamp(0.97rem, 0.55vw + 0.85rem, 1.08rem)`,
    small: `clamp(0.82rem, 0.3vw + 0.76rem, 0.92rem)`,
    eyebrow: `clamp(0.62rem, 0.25vw + 0.58rem, 0.72rem)`,
    sectionY: `clamp(${padMin}px, ${round(7 + density * 2)}vw, ${padMax}px)`,
    gutter: `clamp(1.15rem, 4.4vw, 2rem)`,
    gap: `clamp(0.9rem, 2.4vw, 1.45rem)`,
    maxWidth: "72rem",
    ctaPadding: "clamp(0.85rem, 2.4vw, 1.05rem) clamp(1.25rem, 5vw, 1.85rem)",
    measure: "min(100%, 34rem)",
  };
}

function clampNumber(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

function round(n: number) {
  return Number(n.toFixed(2));
}

/** Fallback used when an older stored spec has no tokens. */
export const DEFAULT_TOKENS: Tokens = buildTokens(
  {
    headingFamily: "sans-serif",
    bodyFamily: "sans-serif",
    headingWeight: 600,
    headingTracking: "-0.02em",
    headingCase: "none",
    scale: 1,
    eyebrowTracking: "0.18em",
  },
  {
    radius: 14,
    radiusSm: 10,
    shadow: "0 18px 40px -26px rgba(0,0,0,0.45)",
    imageRadius: 16,
    border: "1px solid rgba(0,0,0,0.1)",
    sectionPadding: 80,
  },
  { warmth: 0.5, formality: 0.5, playfulness: 0.35, density: 0.5, craft: 0.35 },
);
