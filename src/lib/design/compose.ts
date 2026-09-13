import { planAssets } from "./assets";
import { contrast, extractColors, hexToHsl } from "./color";
import { ctaPrimary, ctaSecondary, heroSub, heroTitle, tagline } from "./copy";
import { FAMILIES, buildPalette, toneDistance, tuneShape, tuneTypography } from "./families";
import { detectIndustry, detectTone, isLocal } from "./keywords";
import { evaluateQuality } from "./quality";
import { buildSections } from "./sections";
import { stockSetFor } from "./stock-map";
import { buildTokens } from "./tokens";
import type { ApplicationInput, DesignSpec, FamilyId } from "./types";
import { buildVariation } from "./variants";

export const DESIGN_SPEC_VERSION = 2;

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
): { family: FamilyId; scores: Record<string, number> } {
  const scores: Record<string, number> = {};
  for (const family of Object.values(FAMILIES)) {
    let score = family.industries[industry] ?? 0;
    score += (1 - toneDistance(tone, family.toneTarget)) * 5;
    if (imageCount === 0 && (family.id === "warm-craft" || family.id === "fresh-retail")) score -= 0.8;
    if (imageCount === 0 && (family.id === "clean-nordic" || family.id === "trust-professional")) score += 0.8;
    if (tone.warmth < 0.3 && family.base.mode === "dark") score += 1.2;
    if (tone.warmth > 0.7 && family.base.mode === "dark") score -= 2.5;
    score += ((seed % 13) / 13) * 0.2;
    scores[family.id] = Number(score.toFixed(3));
  }
  const family = (Object.entries(scores).sort((a, b) => b[1] - a[1])[0]?.[0] || "clean-nordic") as FamilyId;
  return { family, scores };
}

export function composeDesignSpec(app: ApplicationInput, override?: { family?: FamilyId }): DesignSpec {
  const seed = hashSeed(app.reference || app.company || "dwp");
  const description = app.description || "";
  const { industry } = detectIndustry(app.website_type, description, app.extra_requests, app.company);
  const { tone } = detectTone(description, app.extra_requests, app.colors, app.website_type);
  const local = isLocal(description, app.extra_requests, app.address);
  const images = classifyImages(app.file_names || []);
  const photos = images.filter((i) => i.role !== "doc");
  const docCount = images.length - photos.length;

  const chosen = override?.family || chooseFamily(industry, tone, seed, photos.length).family;
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

  const sections = buildSections({
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

  return {
    version: DESIGN_SPEC_VERSION,
    generatedAt: new Date().toISOString(),
    seed,
    family: chosen,
    variant: palette.mode,
    industry,
    tone,
    palette,
    type,
    shape,
    brand: {
      company: app.company,
      tagline: tagline(industry, seed),
      heroTitle: heroTitle(industry, app.company, seed),
      heroSub: heroSub(description, tone, local),
      ctaPrimary: ctaPrimary(industry, tone),
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
  };
}
