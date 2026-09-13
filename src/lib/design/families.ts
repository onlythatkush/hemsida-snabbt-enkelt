import { adjust, ensureContrast, hexToHsl, hslToHex, readableOn, withLightness } from "./color";
import type { FamilyId, IndustryId, Motif, Palette, Shape, Tone, Typography } from "./types";

export type FamilyDef = {
  id: FamilyId;
  label: string;
  base: { primary: string; accent: string; bg: string; surface: string; ink: string; mode: "light" | "dark" };
  type: Typography;
  shape: Shape;
  motif: Motif;
  fonts: string[];
  /** Positive affinity per industry. */
  industries: Partial<Record<IndustryId, number>>;
  /** How well the family matches a tone vector (0-1 targets). */
  toneTarget: Tone;
};

const SERIF = "'Fraunces', 'Iowan Old Style', Georgia, serif";
const SERIF_ELEGANT = "'Playfair Display', Georgia, serif";
const GROTESK = "'Inter', system-ui, -apple-system, sans-serif";
const DISPLAY = "'Space Grotesk', 'Inter', system-ui, sans-serif";

const motif = (m: Motif): Motif => m;

export const FAMILIES: Record<FamilyId, FamilyDef> = {
  "warm-craft": {
    id: "warm-craft",
    label: "Warm Craft",
    base: { primary: "#b4562f", accent: "#c98b2e", bg: "#fbf5ec", surface: "#ffffff", ink: "#2c2119", mode: "light" },
    type: { headingFamily: SERIF, bodyFamily: GROTESK, headingWeight: 600, headingTracking: "-0.015em", headingCase: "none", scale: 1.02, eyebrowTracking: "0.16em" },
    shape: { radius: 22, radiusSm: 14, shadow: "0 18px 40px -24px rgba(74,48,28,0.45)", imageRadius: 24, border: "1px solid rgba(74,48,28,0.12)", sectionPadding: 72 },
    motif: motif({ hero: "fullbleed", card: "elevated", divider: "hairline", overlay: 0.58, heroRatio: "4 / 5", ctaStyle: "gradient", accentUse: "balanced" }),
    fonts: ["Fraunces:wght@400;600;700", "Inter:wght@400;500;600"],
    industries: { bakery: 6, cafe: 5, restaurant: 3, retail: 3, photography: 2, events: 2, health: 1, hospitality: 4 },
    toneTarget: { warmth: 0.95, formality: 0.35, playfulness: 0.5, density: 0.5, craft: 0.9 },
  },
  "clean-nordic": {
    id: "clean-nordic",
    label: "Clean Nordic",
    base: { primary: "#1f2933", accent: "#3f7d8c", bg: "#f6f7f8", surface: "#ffffff", ink: "#161a1d", mode: "light" },
    type: { headingFamily: GROTESK, bodyFamily: GROTESK, headingWeight: 600, headingTracking: "-0.03em", headingCase: "none", scale: 1, eyebrowTracking: "0.2em" },
    shape: { radius: 10, radiusSm: 8, shadow: "0 10px 30px -22px rgba(20,25,30,0.4)", imageRadius: 12, border: "1px solid rgba(20,25,30,0.09)", sectionPadding: 84 },
    motif: motif({ hero: "split", card: "outline", divider: "hairline", overlay: 0.45, heroRatio: "5 / 4", ctaStyle: "solid", accentUse: "sparse" }),
    fonts: ["Inter:wght@400;500;600;700"],
    industries: { consulting: 4, photography: 4, realestate: 2, ecommerce: 2, legal: 2, cleaning: 3 },
    toneTarget: { warmth: 0.35, formality: 0.7, playfulness: 0.2, density: 0.2, craft: 0.25 },
  },
  "trust-professional": {
    id: "trust-professional",
    label: "Trust Professional",
    base: { primary: "#1d3b6e", accent: "#b08d4f", bg: "#f4f6fa", surface: "#ffffff", ink: "#151c28", mode: "light" },
    type: { headingFamily: SERIF_ELEGANT, bodyFamily: GROTESK, headingWeight: 600, headingTracking: "-0.01em", headingCase: "none", scale: 1, eyebrowTracking: "0.18em" },
    shape: { radius: 8, radiusSm: 6, shadow: "0 14px 34px -26px rgba(15,28,50,0.55)", imageRadius: 10, border: "1px solid rgba(21,28,40,0.12)", sectionPadding: 80 },
    motif: motif({ hero: "editorial", card: "outline", divider: "rule", overlay: 0.55, heroRatio: "3 / 2", ctaStyle: "solid", accentUse: "sparse" }),
    fonts: ["Playfair Display:wght@500;600;700", "Inter:wght@400;500;600"],
    industries: { legal: 6, health: 3, cleaning: 2, consulting: 2 },
    toneTarget: { warmth: 0.3, formality: 0.95, playfulness: 0.12, density: 0.5, craft: 0.3 },
  },
  "bold-modern": {
    id: "bold-modern",
    label: "Bold Modern",
    base: { primary: "#f25c26", accent: "#111418", bg: "#ffffff", surface: "#f2f3f5", ink: "#0d0f12", mode: "light" },
    type: { headingFamily: DISPLAY, bodyFamily: GROTESK, headingWeight: 700, headingTracking: "-0.035em", headingCase: "none", scale: 1.08, eyebrowTracking: "0.22em" },
    shape: { radius: 4, radiusSm: 3, shadow: "0 20px 40px -30px rgba(0,0,0,0.6)", imageRadius: 4, border: "1.5px solid rgba(13,15,18,0.14)", sectionPadding: 80 },
    motif: motif({ hero: "poster", card: "flat", divider: "rule", overlay: 0.6, heroRatio: "1 / 1", ctaStyle: "solid", accentUse: "loud" }),
    fonts: ["Space Grotesk:wght@500;700", "Inter:wght@400;500;600"],
    industries: { ecommerce: 2, events: 3, consulting: 2 },
    toneTarget: { warmth: 0.4, formality: 0.5, playfulness: 0.5, density: 0.85, craft: 0.35 },
  },
  "soft-wellness": {
    id: "soft-wellness",
    label: "Soft Wellness",
    base: { primary: "#7f9d84", accent: "#d9a88f", bg: "#f7f3ef", surface: "#ffffff", ink: "#2d302c", mode: "light" },
    type: { headingFamily: SERIF_ELEGANT, bodyFamily: GROTESK, headingWeight: 500, headingTracking: "0em", headingCase: "none", scale: 1, eyebrowTracking: "0.24em" },
    shape: { radius: 28, radiusSm: 18, shadow: "0 16px 40px -28px rgba(60,60,50,0.4)", imageRadius: 28, border: "1px solid rgba(45,48,44,0.08)", sectionPadding: 88 },
    motif: motif({ hero: "split", card: "elevated", divider: "none", overlay: 0.4, heroRatio: "4 / 5", ctaStyle: "pill", accentUse: "sparse" }),
    fonts: ["Playfair Display:wght@500;600", "Inter:wght@400;500"],
    industries: { cafe: 2, photography: 2, events: 1 },
    toneTarget: { warmth: 0.7, formality: 0.45, playfulness: 0.3, density: 0.2, craft: 0.45 },
  },
  "fresh-retail": {
    id: "fresh-retail",
    label: "Fresh Retail",
    base: { primary: "#e0483c", accent: "#f2b705", bg: "#fffdf8", surface: "#ffffff", ink: "#20211f", mode: "light" },
    type: { headingFamily: DISPLAY, bodyFamily: GROTESK, headingWeight: 700, headingTracking: "-0.025em", headingCase: "none", scale: 1.04, eyebrowTracking: "0.16em" },
    shape: { radius: 16, radiusSm: 12, shadow: "0 14px 34px -24px rgba(32,33,31,0.4)", imageRadius: 16, border: "1px solid rgba(32,33,31,0.1)", sectionPadding: 72 },
    motif: motif({ hero: "poster", card: "elevated", divider: "hairline", overlay: 0.5, heroRatio: "1 / 1", ctaStyle: "pill", accentUse: "loud" }),
    fonts: ["Space Grotesk:wght@500;700", "Inter:wght@400;500;600"],
    industries: { ecommerce: 6, retail: 5, bakery: 2, events: 2 },
    toneTarget: { warmth: 0.6, formality: 0.35, playfulness: 0.85, density: 0.6, craft: 0.3 },
  },
  "night-premium": {
    id: "night-premium",
    label: "Night Premium",
    base: { primary: "#c9a227", accent: "#7f8dad", bg: "#0f1116", surface: "#171a21", ink: "#f3f0ea", mode: "dark" },
    type: { headingFamily: SERIF_ELEGANT, bodyFamily: GROTESK, headingWeight: 600, headingTracking: "-0.01em", headingCase: "none", scale: 1.06, eyebrowTracking: "0.26em" },
    shape: { radius: 14, radiusSm: 10, shadow: "0 24px 60px -30px rgba(0,0,0,0.8)", imageRadius: 16, border: "1px solid rgba(255,255,255,0.1)", sectionPadding: 88 },
    motif: motif({ hero: "cinematic", card: "glass", divider: "glow", overlay: 0.72, heroRatio: "3 / 4", ctaStyle: "outline", accentUse: "sparse", imageFilter: "saturate(0.95) contrast(1.06)" }),
    fonts: ["Playfair Display:wght@500;600;700", "Inter:wght@400;500;600"],
    industries: { restaurant: 6, events: 5, photography: 3, hospitality: 6 },
    toneTarget: { warmth: 0.2, formality: 0.9, playfulness: 0.2, density: 0.7, craft: 0.4 },
  },

  /* ---------------------------------------------------------- v2 families */

  "cinematic-auto": {
    id: "cinematic-auto",
    label: "Cinematic Auto",
    base: { primary: "#c1122b", accent: "#9aa3ad", bg: "#08090c", surface: "#111318", ink: "#f2f1ee", mode: "dark" },
    type: { headingFamily: DISPLAY, bodyFamily: GROTESK, headingWeight: 700, headingTracking: "-0.045em", headingCase: "upper", scale: 1.1, eyebrowTracking: "0.32em" },
    shape: { radius: 2, radiusSm: 2, shadow: "0 40px 90px -40px rgba(0,0,0,0.95)", imageRadius: 2, border: "1px solid rgba(255,255,255,0.09)", sectionPadding: 96 },
    motif: motif({ hero: "cinematic", card: "glass", divider: "glow", overlay: 0.78, heroRatio: "9 / 16", ctaStyle: "outline", accentUse: "sparse", imageFilter: "contrast(1.12) saturate(0.88) brightness(0.94)" }),
    fonts: ["Space Grotesk:wght@500;700", "Inter:wght@400;500;600"],
    industries: { automotive: 9, realestate: 2, events: 2 },
    toneTarget: { warmth: 0.15, formality: 0.85, playfulness: 0.15, density: 0.8, craft: 0.35 },
  },
  "industrial-trade": {
    id: "industrial-trade",
    label: "Industrial Trade",
    base: { primary: "#f0a020", accent: "#1c2126", bg: "#f3f4f5", surface: "#ffffff", ink: "#14181c", mode: "light" },
    type: { headingFamily: DISPLAY, bodyFamily: GROTESK, headingWeight: 700, headingTracking: "-0.03em", headingCase: "upper", scale: 1.05, eyebrowTracking: "0.24em" },
    shape: { radius: 3, radiusSm: 2, shadow: "0 18px 36px -28px rgba(14,18,22,0.6)", imageRadius: 3, border: "2px solid rgba(20,24,28,0.14)", sectionPadding: 76 },
    motif: motif({ hero: "poster", card: "flat", divider: "rule", overlay: 0.66, heroRatio: "4 / 5", ctaStyle: "solid", accentUse: "loud" }),
    fonts: ["Space Grotesk:wght@500;700", "Inter:wght@400;500;600;700"],
    industries: { construction: 9, cleaning: 5, automotive: 3, realestate: 2 },
    toneTarget: { warmth: 0.35, formality: 0.55, playfulness: 0.2, density: 0.85, craft: 0.6 },
  },
  "calm-wellness": {
    id: "calm-wellness",
    label: "Calm Wellness",
    base: { primary: "#8a9d8c", accent: "#cfa98c", bg: "#f8f5f1", surface: "#ffffff", ink: "#2b2d2a", mode: "light" },
    type: { headingFamily: SERIF_ELEGANT, bodyFamily: GROTESK, headingWeight: 500, headingTracking: "-0.005em", headingCase: "none", scale: 0.98, eyebrowTracking: "0.3em" },
    shape: { radius: 30, radiusSm: 20, shadow: "0 24px 56px -36px rgba(60,58,52,0.45)", imageRadius: 32, border: "1px solid rgba(43,45,42,0.07)", sectionPadding: 92 },
    motif: motif({ hero: "split", card: "elevated", divider: "none", overlay: 0.38, heroRatio: "4 / 5", ctaStyle: "pill", accentUse: "sparse", imageFilter: "saturate(0.94)" }),
    fonts: ["Playfair Display:wght@500;600", "Inter:wght@400;500"],
    industries: { beauty: 9, health: 8, fitness: 2, hospitality: 2 },
    toneTarget: { warmth: 0.72, formality: 0.45, playfulness: 0.25, density: 0.15, craft: 0.45 },
  },
  "editorial-b2b": {
    id: "editorial-b2b",
    label: "Editorial B2B",
    base: { primary: "#22405c", accent: "#c2703c", bg: "#f5f6f7", surface: "#ffffff", ink: "#12171c", mode: "light" },
    type: { headingFamily: SERIF, bodyFamily: GROTESK, headingWeight: 600, headingTracking: "-0.02em", headingCase: "none", scale: 1.02, eyebrowTracking: "0.22em" },
    shape: { radius: 6, radiusSm: 4, shadow: "0 16px 38px -30px rgba(12,20,28,0.5)", imageRadius: 6, border: "1px solid rgba(18,23,28,0.1)", sectionPadding: 88 },
    motif: motif({ hero: "editorial", card: "outline", divider: "rule", overlay: 0.5, heroRatio: "16 / 10", ctaStyle: "solid", accentUse: "balanced" }),
    fonts: ["Fraunces:wght@400;600;700", "Inter:wght@400;500;600"],
    industries: { consulting: 9, legal: 4, photography: 2, ecommerce: 1 },
    toneTarget: { warmth: 0.35, formality: 0.8, playfulness: 0.15, density: 0.45, craft: 0.35 },
  },
  "estate-modern": {
    id: "estate-modern",
    label: "Estate Modern",
    base: { primary: "#2f4f4a", accent: "#b99a63", bg: "#f4f3ef", surface: "#ffffff", ink: "#1a1d1c", mode: "light" },
    type: { headingFamily: SERIF_ELEGANT, bodyFamily: GROTESK, headingWeight: 500, headingTracking: "-0.015em", headingCase: "none", scale: 1.04, eyebrowTracking: "0.28em" },
    shape: { radius: 4, radiusSm: 3, shadow: "0 26px 60px -38px rgba(20,26,24,0.6)", imageRadius: 4, border: "1px solid rgba(26,29,28,0.1)", sectionPadding: 90 },
    motif: motif({ hero: "fullbleed", card: "flat", divider: "hairline", overlay: 0.55, heroRatio: "3 / 4", ctaStyle: "outline", accentUse: "sparse" }),
    fonts: ["Playfair Display:wght@500;600;700", "Inter:wght@400;500;600"],
    industries: { realestate: 9, hospitality: 3, construction: 2, photography: 2 },
    toneTarget: { warmth: 0.4, formality: 0.85, playfulness: 0.12, density: 0.4, craft: 0.4 },
  },
  "kinetic-fitness": {
    id: "kinetic-fitness",
    label: "Kinetic Fitness",
    base: { primary: "#e8462f", accent: "#f5d03a", bg: "#0d0f11", surface: "#16191d", ink: "#f6f6f5", mode: "dark" },
    type: { headingFamily: DISPLAY, bodyFamily: GROTESK, headingWeight: 700, headingTracking: "-0.05em", headingCase: "upper", scale: 1.12, eyebrowTracking: "0.3em" },
    shape: { radius: 3, radiusSm: 2, shadow: "0 30px 70px -36px rgba(0,0,0,0.9)", imageRadius: 3, border: "1px solid rgba(255,255,255,0.12)", sectionPadding: 82 },
    motif: motif({ hero: "poster", card: "glass", divider: "glow", overlay: 0.66, heroRatio: "4 / 5", ctaStyle: "solid", accentUse: "loud", imageFilter: "contrast(1.1) saturate(1.05)" }),
    fonts: ["Space Grotesk:wght@500;700", "Inter:wght@400;500;600;700"],
    industries: { fitness: 9, health: 2, events: 2 },
    toneTarget: { warmth: 0.35, formality: 0.4, playfulness: 0.6, density: 0.9, craft: 0.25 },
  },
};

export function listFamilies() {
  return Object.values(FAMILIES).map((f) => ({ id: f.id, label: f.label, mode: f.base.mode }));
}


export function toneDistance(a: Tone, b: Tone) {
  const keys: (keyof Tone)[] = ["warmth", "formality", "playfulness", "density", "craft"];
  return keys.reduce((sum, k) => sum + Math.abs(a[k] - b[k]), 0) / keys.length;
}

/** Builds a full palette from the family base plus optional customer colours. */
export function buildPalette(family: FamilyDef, customer: string[], tone: Tone): Palette {
  const forceDark = family.base.mode === "dark";
  const primary = customer[0] || family.base.primary;
  const accent = customer[1] || family.base.accent;
  return finishPalette(family, primary, accent, forceDark, tone);
}

function finishPalette(family: FamilyDef, primary: string, accent: string, dark: boolean, tone: Tone): Palette {
  
  const primaryHsl = hexToHsl(primary);

  if (dark) {
    const bg = hslToHex({ h: primaryHsl.h, s: Math.min(18, primaryHsl.s * 0.3), l: 7 });
    const surface = adjust(bg, { l: 5 });
    const ink = "#f4f1ea";
    const safePrimary = ensureContrast(primary, bg, 3.2);
    return {
      mode: "dark",
      bg,
      surface,
      surfaceAlt: adjust(bg, { l: 9 }),
      ink,
      muted: adjust(ink, { l: -32 }),
      border: "rgba(255,255,255,0.12)",
      primary: safePrimary,
      primarySoft: adjust(safePrimary, { l: -28, s: -10 }),
      onPrimary: readableOn(safePrimary),
      accent: ensureContrast(accent, bg, 3),
    };
  }

  const warmth = tone.warmth;
  // Near-white lightness kills saturation, so tinted backgrounds need a high S value.
  const bgSat = Math.min(14 + warmth * 46, 62);
  const bgLight = 96.5 - tone.density * 2;
  const bg = hslToHex({ h: primaryHsl.h, s: bgSat, l: bgLight });
  const surface = warmth > 0.7 ? hslToHex({ h: primaryHsl.h, s: Math.min(bgSat * 0.6, 40), l: 99 }) : "#ffffff";
  const ink = hslToHex({ h: primaryHsl.h, s: 12 + warmth * 6, l: 13 + (1 - warmth) * 3 });
  const safePrimary = ensureContrast(primary, bg, 3.4);
  return {
    mode: "light",
    bg,
    surface,
    surfaceAlt: hslToHex({ h: primaryHsl.h, s: Math.min(bgSat + 8, 66), l: bgLight - 4.5 }),
    ink,
    // Secondary text must stay above WCAG AA on the tinted background.
    muted: ensureContrast(withLightness(ink, 42), bg, 4.8),
    border: `rgba(0,0,0,${(0.08 + tone.density * 0.05).toFixed(3)})`,
    primary: safePrimary,
    primarySoft: withLightness(safePrimary, 92),
    onPrimary: readableOn(safePrimary),
    accent: ensureContrast(accent, bg, 2.6),
  };
}

/** Applies tone micro-adjustments to typography and shape. */
export function tuneTypography(base: Typography, tone: Tone): Typography {
  return {
    ...base,
    scale: Number((base.scale * (1 + (tone.density - 0.5) * 0.08)).toFixed(3)),
    headingWeight: tone.formality > 0.8 ? base.headingWeight : Math.max(500, base.headingWeight - (tone.warmth > 0.75 ? 0 : 0)),
  };
}

export function tuneShape(base: Shape, tone: Tone): Shape {
  const softness = tone.warmth * 0.6 + tone.playfulness * 0.4;
  const radius = Math.round(base.radius * (0.75 + softness * 0.6));
  return {
    ...base,
    radius,
    radiusSm: Math.round(base.radiusSm * (0.75 + softness * 0.6)),
    imageRadius: Math.round(base.imageRadius * (0.75 + softness * 0.6)),
    sectionPadding: Math.round(base.sectionPadding * (1.12 - tone.density * 0.25)),
  };
}
