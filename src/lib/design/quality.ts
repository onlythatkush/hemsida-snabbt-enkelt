import { contrast } from "./color";
import type { DesignSpec, QaCheck, QaReport } from "./types";

const LONGEST_MOBILE_WORD = 15;

/**
 * Structural quality gate for a generated preview.
 *
 * It never blocks the production submission flow — it only reports whether a
 * preview is safe to mark as ready, so admin (and later the Hub) can see why.
 */
export function evaluateQuality(spec: DesignSpec): QaReport {
  const checks: QaCheck[] = [];
  const p = spec.palette;
  const b = spec.brand;

  const hero = spec.sections.find((s) => s.type === "hero");
  const heroImage = (hero?.images || []).length > 0;
  checks.push({
    id: "hero",
    label: "Hero finns",
    level: hero ? "pass" : "fail",
    detail: hero ? undefined : "Sidan saknar en inledande sektion.",
  });
  checks.push({
    id: "hero-media",
    label: "Hero har bild",
    level: heroImage ? "pass" : "warn",
    detail: heroImage ? undefined : "Kunden har ingen egen bild — kurerad bild används.",
  });

  const hasCta = Boolean(b.ctaPrimary && b.ctaPrimary.trim());
  checks.push({ id: "cta", label: "Tydlig uppmaning", level: hasCta ? "pass" : "fail" });

  const hasContact = Boolean(b.email || b.phone || b.address);
  checks.push({
    id: "contact",
    label: "Kontaktuppgift finns",
    level: hasContact ? "pass" : "warn",
    detail: hasContact ? undefined : "Ingen e-post, telefon eller adress i underlaget.",
  });

  const contactSection = spec.sections.some((s) => s.type === "contact");
  checks.push({ id: "contact-section", label: "Kontaktsektion", level: contactSection ? "pass" : "fail" });

  // Readability: body text against the page background, and button label on primary.
  const inkContrast = contrast(p.ink, p.bg);
  checks.push({
    id: "contrast-body",
    label: "Läsbar brödtext",
    level: inkContrast >= 7 ? "pass" : inkContrast >= 4.5 ? "warn" : "fail",
    detail: `Kontrast ${inkContrast.toFixed(1)}:1`,
  });

  const mutedContrast = contrast(p.muted, p.bg);
  checks.push({
    id: "contrast-muted",
    label: "Läsbar sekundärtext",
    level: mutedContrast >= 4.5 ? "pass" : mutedContrast >= 3.2 ? "warn" : "fail",
    detail: `Kontrast ${mutedContrast.toFixed(1)}:1`,
  });

  const ctaContrast = contrast(p.onPrimary, p.primary);
  checks.push({
    id: "contrast-cta",
    label: "Läsbar knapptext",
    level: ctaContrast >= 4.5 ? "pass" : ctaContrast >= 3 ? "warn" : "fail",
    detail: `Kontrast ${ctaContrast.toFixed(1)}:1`,
  });

  // Mobile overflow risk: very long unbroken words in headings.
  const headings = [b.heroTitle, b.company, ...spec.sections.map((s) => s.title || "")];
  const longWord = headings
    .flatMap((h) => (h || "").split(/\s+/))
    .find((w) => w.length > LONGEST_MOBILE_WORD);
  checks.push({
    id: "overflow-words",
    label: "Ingen överflödsrisk i rubriker",
    level: longWord ? "warn" : "pass",
    detail: longWord ? `Långt ord: "${longWord}" — bryts automatiskt i mobil.` : undefined,
  });

  const heroTitleLength = (b.heroTitle || "").length;
  checks.push({
    id: "hero-length",
    label: "Rimlig rubriklängd",
    level: heroTitleLength === 0 ? "fail" : heroTitleLength > 75 ? "warn" : "pass",
    detail: heroTitleLength > 75 ? "Rubriken är lång och tar mycket plats i mobil." : undefined,
  });

  const sectionCount = spec.sections.length;
  checks.push({
    id: "structure",
    label: "Tillräckligt innehåll",
    level: sectionCount >= 6 ? "pass" : sectionCount >= 4 ? "warn" : "fail",
    detail: `${sectionCount} sektioner`,
  });

  const ownPhotos = spec.images.filter((i) => i.role !== "doc" && i.role !== "logo").length;
  checks.push({
    id: "media-coverage",
    label: "Bildmaterial",
    level: ownPhotos >= 3 ? "pass" : ownPhotos > 0 ? "warn" : "warn",
    detail: ownPhotos ? `${ownPhotos} egna bilder` : "Inga egna bilder — kurerade bilder används.",
  });

  checks.push({
    id: "responsive-tokens",
    label: "Mobilsäkra storlekar",
    level: spec.tokens ? "pass" : "warn",
    detail: spec.tokens ? undefined : "Äldre spec utan clamp-baserade tokens.",
  });

  const fails = checks.filter((c) => c.level === "fail").length;
  const warns = checks.filter((c) => c.level === "warn").length;
  const score = Math.max(0, Math.round(100 - fails * 22 - warns * 6));
  const status: QaReport["status"] = fails > 0 ? "blocked" : warns > 2 ? "review" : "ready";

  return { score, status, checks, evaluatedAt: new Date().toISOString() };
}
