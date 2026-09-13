import type { CSSProperties } from "react";
import { stockImages } from "@/lib/design/stock";
import { DEFAULT_TOKENS } from "@/lib/design/tokens";
import type { DesignSpec, Motif, Section, SpecImage, Tokens, Variation } from "@/lib/design/types";

export function rgba(hex: string, alpha: number) {
  let h = (hex || "#000000").replace("#", "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  const r = parseInt(h.slice(0, 2), 16) || 0;
  const g = parseInt(h.slice(2, 4), 16) || 0;
  const b = parseInt(h.slice(4, 6), 16) || 0;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export const DEFAULT_MOTIF: Motif = {
  hero: "fullbleed",
  card: "elevated",
  divider: "hairline",
  overlay: 0.58,
  heroRatio: "4 / 5",
  ctaStyle: "gradient",
  accentUse: "balanced",
};

export const DEFAULT_VARIATION: Variation = {
  id: "legacy/v1",
  heroAlign: "left",
  sectionOrder: [],
  cardColumns: 3,
  galleryStyle: "mosaic",
  useStatementAccent: true,
};

export type Ctx = {
  spec: DesignSpec;
  motif: Motif;
  tokens: Tokens;
  variation: Variation;
  logo?: SpecImage;
  stock: string[];
  imagesFor: (section: Section, index: number, count: number) => string[];
};

export function buildCtx(spec: DesignSpec): Ctx {
  const stock = stockImages(spec.stockSet, spec.industry);
  const logo = spec.images.find((i) => i.role === "logo" && i.url);

  const imagesFor = (section: Section, index: number, count: number) => {
    const own = (section.images || [])
      .map((i) => spec.images[i])
      .filter((img): img is SpecImage => Boolean(img) && img.role !== "logo" && Boolean(img.url))
      .map((img) => img.url as string);
    const out = own.slice(0, count);
    for (let k = 0; out.length < count; k++) {
      const start = index === 0 ? 0 : 1;
      out.push(stock[(start + index + k + out.length) % stock.length]);
      if (k > 8) break;
    }
    return out;
  };

  return {
    spec,
    motif: spec.motif || DEFAULT_MOTIF,
    tokens: spec.tokens || DEFAULT_TOKENS,
    variation: spec.variation || DEFAULT_VARIATION,
    logo,
    stock,
    imagesFor,
  };
}

/** Root CSS variables — everything downstream sizes off these. */
export function themeVars(ctx: Ctx): CSSProperties {
  const { spec, tokens, motif } = ctx;
  const p = spec.palette;
  const t = spec.type;
  const s = spec.shape;
  return {
    "--p-bg": p.bg,
    "--p-surface": p.surface,
    "--p-surface-alt": p.surfaceAlt,
    "--p-ink": p.ink,
    "--p-muted": p.muted,
    "--p-border": p.border,
    "--p-primary": p.primary,
    "--p-primary-soft": p.primarySoft,
    "--p-on-primary": p.onPrimary,
    "--p-accent": p.accent,
    "--p-tint": p.tint || p.primarySoft,
    "--f-head": t.headingFamily,
    "--f-body": t.bodyFamily,
    "--r-lg": `${s.radius}px`,
    "--r-sm": `${s.radiusSm}px`,
    "--r-img": `${s.imageRadius}px`,
    "--shadow": s.shadow,
    "--t-h1": tokens.h1,
    "--t-h2": tokens.h2,
    "--t-h3": tokens.h3,
    "--t-body": tokens.body,
    "--t-small": tokens.small,
    "--t-eyebrow": tokens.eyebrow,
    "--t-section-y": tokens.sectionY,
    "--t-gutter": tokens.gutter,
    "--t-gap": tokens.gap,
    "--t-max": tokens.maxWidth,
    "--t-cta-pad": tokens.ctaPadding,
    "--t-measure": tokens.measure,
    "--img-filter": motif.imageFilter || "none",
  } as CSSProperties;
}

/** Card surface styling per family motif. */
export function cardStyle(ctx: Ctx, onDark = false): CSSProperties {
  const p = ctx.spec.palette;
  switch (ctx.motif.card) {
    case "flat":
      return { background: p.surface, border: `1px solid ${p.border}`, borderRadius: "var(--r-lg)" };
    case "outline":
      return { background: "transparent", border: `1px solid ${p.border}`, borderRadius: "var(--r-lg)" };
    case "glass":
      return {
        background: onDark ? rgba("#ffffff", 0.06) : rgba(p.surface, 0.72),
        border: `1px solid ${rgba("#ffffff", onDark ? 0.14 : 0.4)}`,
        borderRadius: "var(--r-lg)",
        backdropFilter: "blur(10px)",
      };
    default:
      return {
        background: p.surface,
        border: `1px solid ${p.border}`,
        borderRadius: "var(--r-lg)",
        boxShadow: "var(--shadow)",
      };
  }
}

/** Primary call to action styling per motif. */
export function ctaStyle(ctx: Ctx, onDark = false): CSSProperties {
  const p = ctx.spec.palette;
  const base: CSSProperties = {
    padding: "var(--t-cta-pad)",
    borderRadius: ctx.motif.ctaStyle === "pill" ? "999px" : "var(--r-sm)",
    fontSize: "var(--t-small)",
    fontWeight: 600,
    lineHeight: 1.1,
  };
  switch (ctx.motif.ctaStyle) {
    case "outline":
      return {
        ...base,
        background: onDark ? rgba("#ffffff", 0.06) : "transparent",
        border: `1px solid ${onDark ? rgba("#ffffff", 0.5) : p.primary}`,
        color: onDark ? "#ffffff" : p.primary,
      };
    case "gradient":
      return {
        ...base,
        background: `linear-gradient(135deg, ${p.primary}, ${p.accent})`,
        color: p.onPrimary,
        boxShadow: `0 18px 40px -20px ${rgba(p.primary, 0.85)}`,
      };
    default:
      return { ...base, background: p.primary, color: p.onPrimary };
  }
}

export function headingStyle(ctx: Ctx, size: "h1" | "h2" | "h3", color: string): CSSProperties {
  const t = ctx.spec.type;
  return {
    fontFamily: "var(--f-head)",
    fontWeight: t.headingWeight,
    letterSpacing: t.headingTracking,
    textTransform: t.headingCase === "upper" ? "uppercase" : "none",
    fontSize: `var(--t-${size})`,
    lineHeight: size === "h1" ? 1.05 : size === "h2" ? 1.14 : 1.25,
    color,
    // Never let a long Swedish compound word push the layout sideways on mobile.
    overflowWrap: "anywhere",
    hyphens: "auto",
  };
}
