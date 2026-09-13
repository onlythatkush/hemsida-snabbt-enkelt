import { analyzeArt } from "./art";
import { planAssets } from "./assets";
import { contrast, extractColors, hexToHsl } from "./color";
import { ctaPrimary, ctaSecondary, heroSub, heroTitle, tagline } from "./copy";
import { FAMILIES, buildPalette, toneDistance, tuneShape, tuneTypography } from "./families";
import { detectIndustry, detectTone, isLocal } from "./keywords";
import { evaluateQuality } from "./quality";
import { buildSections } from "./sections";
import { stockSetFor } from "./stock-map";
import { buildTokens } from "./tokens";
import type { ApplicationInput, ArtDirection, DesignSpec, FamilyId } from "./types";
import { buildVariation } from "./variants";

export const DESIGN_SPEC_VERSION = 6;

function hashSeed(input: string) {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash);
}


export function chooseFamily(
  industry: ReturnType<typeof detectIndustry>["industry"],
  tone: ReturnType<typeof detectTone>["tone"],
  seed: number,
  imageCount: number,
  art?: ArtDirection,
): { family: FamilyId; scores: Record<string, number> } {
  const scores: Record<string, number> = {};
  // A specialist family for the industry must always beat a generic one.
  const bestAffinity = Math.max(...Object.values(FAMILIES).map((f) => f.industries[industry] ?? 0));
  for (const family of Object.values(FAMILIES)) {
    const affinity = family.industries[industry] ?? 0;
    let score = affinity * 1.6;
    if (bestAffinity >= 6 && affinity < bestAffinity - 3) score -= 6;
    score += (1 - toneDistance(tone, family.toneTarget)) * 5;
    if (imageCount === 0 && (family.id === "warm-craft" || family.id === "fresh-retail")) score -= 0.8;
    if (imageCount === 0 && (family.id === "clean-nordic" || family.id === "editorial-b2b")) score += 0.8;
    if (imageCount >= 4 && (family.motif.hero === "cinematic" || family.motif.hero === "fullbleed")) score += 0.5;
    if (tone.warmth < 0.3 && family.base.mode === "dark") score += 1.2;
    if (tone.warmth > 0.7 && family.base.mode === "dark") score -= 2.5;
    // Requested night/city mood must actually produce a dark, cinematic page.
    if (art?.mood === "night") {
      score += family.base.mode === "dark" ? 2.4 : -1.6;
      if (family.motif.hero === "cinematic") score += 1.2;
    }
    if (art?.subjects.includes("luxury") && family.base.mode === "dark") score += 0.8;
    score += ((seed % 13) / 13) * 0.2;
    scores[family.id] = Number(score.toFixed(3));
  }
  const family = (Object.entries(scores).sort((a, b) => b[1] - a[1])[0]?.[0] || "clean-nordic") as FamilyId;
  return { family, scores };
}

export function composeDesignSpec(
  app: ApplicationInput,
  override?: { family?: FamilyId; revision?: number },
): DesignSpec {
  // Deterministic per (application, revision): pressing "Gör ny hemsida" bumps
  // the revision, which yields a genuinely different — but reproducible — page.
  const revision = Math.max(1, Math.floor(override?.revision ?? 1));
  const seed = hashSeed(`${app.reference || app.company || "dwp"}#r${revision}`);
  const description = app.description || "";
  const { industry } = detectIndustry(app.website_type, description, app.extra_requests, app.company);
  const { tone } = detectTone(description, app.extra_requests, app.colors, app.website_type);
  const local = isLocal(description, app.extra_requests, app.address);
  const { images, photoCount, rejected } = planAssets(app.file_names || []);
  const docCount = images.filter((i) => i.role === "doc").length;

  const art = analyzeArt(industry, description, app.extra_requests, app.website_type);

  const chosen = override?.family || chooseFamily(industry, tone, seed, photoCount, art).family;
  const familyDef = FAMILIES[chosen];
  // Pale colours make poor primaries; the strongest colour leads, pale ones become tints.
  const allColors = extractColors(app.colors);
  const strong = allColors.filter((c) => contrast(c, "#ffffff") >= 2.2);
  const pale = allColors.filter((c) => contrast(c, "#ffffff") < 2.2);
  // Keep the order the customer wrote them in, but let a saturated colour lead
  // over a neutral (black/grey) so pages don't all end up with the same ink primary.
  const saturation = (hex: string) => hexToHsl(hex).s;
  const ordered = [...strong].sort((a, b) => {
    const sa = saturation(a) >= 14 ? 1 : 0;
    const sb = saturation(b) >= 14 ? 1 : 0;
    return sb - sa;
  });
  const customerColors = ordered.length ? ordered : pale;

  const palette = buildPalette(familyDef, customerColors, tone);
  if (pale.length) palette.tint = pale[0];
  const type = tuneTypography(familyDef.type, tone);
  const shape = tuneShape(familyDef.shape, tone);

  const built = buildSections({
    art,
    industry,
    tone,
    local,
    company: app.company,
    description,
    extra: app.extra_requests,
    images,
    docCount,
    seed,
  });

  const variation = buildVariation(chosen, seed, built.map((s) => s.id));
  const sections = [...built].sort(
    (a, b) => variation.sectionOrder.indexOf(a.id) - variation.sectionOrder.indexOf(b.id),
  );
  const tokens = buildTokens(type, shape, tone);

  const generatedAt = new Date().toISOString();
  const heroAsset = images.find((i) => i.role === "hero");

  const spec: DesignSpec = {
    version: DESIGN_SPEC_VERSION,
    generatedAt,
    revision,
    seed,
    family: chosen,
    variant: variation.id,
    industry,
    tone,
    palette,
    type,
    shape,
    motif: familyDef.motif,
    tokens,
    variation,
    brand: {
      company: app.company,
      tagline: tagline(industry, seed, art.subjects),
      heroTitle: heroTitle(industry, app.company, seed, art.subjects),
      heroSub: heroSub(description, tone, local),
      ctaPrimary: ctaPrimary(industry, tone, art.subjects),
      ctaSecondary: ctaSecondary(tone),
      email: app.email || undefined,
      phone: app.phone || undefined,
      address: app.address || undefined,
      socialLinks: app.social_links || undefined,
    },
    images,
    sections,
    fonts: familyDef.fonts,
    stockSet: stockSetFor(industry),
    art,
  };

  spec.qa = evaluateQuality(spec);
  spec.engine = {
    version: DESIGN_SPEC_VERSION,
    revision,
    generatedAt,
    seed,
    family: chosen,
    industry,
    heroSource: heroAsset ? "customer" : spec.stockSet ? "curated" : "none",
    heroAsset: heroAsset?.name,
    stockSet: spec.stockSet,
    rejectedAssets: rejected,
    qaScore: spec.qa.score,
    qaStatus: spec.qa.status,
  };
  return spec;
}
