import { isScreenshotLike } from "./assets";
import { contrast } from "./color";
import { FAMILIES } from "./families";
import { allowedSetsFor, stockSetFor } from "./stock-map";
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

  const ownPhotos = spec.images.filter(
    (i) => i.role !== "doc" && i.role !== "logo" && i.role !== "reject",
  ).length;
  checks.push({
    id: "media-coverage",
    label: "Bildmaterial",
    level: ownPhotos >= 3 ? "pass" : ownPhotos > 0 ? "warn" : "warn",
    detail: ownPhotos ? `${ownPhotos} egna bilder` : "Inga egna bilder — kurerade bilder används.",
  });

  // v2.2 — screenshots / UI captures must never be rendered as website media.
  const renderedAssets = spec.images.filter((i) => i.role === "hero" || i.role === "feature" || i.role === "gallery");
  const badAsset = renderedAssets.find((i) => isScreenshotLike(i.name) || isScreenshotLike(i.path));
  checks.push({
    id: "media-safety",
    label: "Inga skärmdumpar som sidmaterial",
    level: badAsset ? "fail" : "pass",
    detail: badAsset ? `"${badAsset.name}" ser ut som en skärmdump och får inte användas.` : undefined,
  });

  // v2.1 — media relevance: fallback photography must match the industry.
  const usedSet = (spec.stockSet || stockSetFor(spec.industry)) as ReturnType<typeof stockSetFor>;
  const relevantSet = allowedSetsFor(spec.industry).includes(usedSet);
  checks.push({
    id: "media-relevance",
    label: "Relevanta bilder",
    level: relevantSet ? "pass" : "fail",
    detail: relevantSet ? undefined : `Bildsetet "${usedSet}" hör inte till branschen ${spec.industry}.`,
  });

  // v2.1 — the chosen family must actually suit the detected industry.
  const affinity = FAMILIES[spec.family]?.industries[spec.industry] ?? 0;
  const bestAffinity = Math.max(...Object.values(FAMILIES).map((f) => f.industries[spec.industry] ?? 0));
  const familyOk = bestAffinity < 6 || affinity >= bestAffinity - 3;
  checks.push({
    id: "family-match",
    label: "Designfamilj matchar bransch",
    level: familyOk ? "pass" : "fail",
    detail: familyOk ? undefined : `${spec.family} passar inte ${spec.industry}.`,
  });

  // v2.1 — explicit image wishes must be visible in the hero.
  const art = spec.art;
  if (art?.requireHeroMedia) {
    const heroHasMedia = heroImage || Boolean(spec.stockSet);
    const cinematicHero = spec.motif?.hero === "cinematic" || spec.motif?.hero === "fullbleed" || spec.motif?.hero === "poster";
    checks.push({
      id: "wish-hero-media",
      label: "Önskad hero-bild",
      level: heroHasMedia && cinematicHero ? "pass" : "warn",
      detail:
        heroHasMedia && cinematicHero
          ? `Önskemål i bild: ${art.subjects.join(", ")}`
          : "Kunden bad om bild i bakgrunden men hero är inte bilddriven.",
    });
    if (art.mood === "night") {
      checks.push({
        id: "wish-mood",
        label: "Önskad stämning",
        level: spec.palette.mode === "dark" ? "pass" : "fail",
        detail: spec.palette.mode === "dark" ? undefined : "Mörk/nattkänsla efterfrågades men sidan blev ljus.",
      });
    }
  }

  checks.push({
    id: "responsive-tokens",
    label: "Mobilsäkra storlekar",
    level: spec.tokens ? "pass" : "warn",
    detail: spec.tokens ? undefined : "Äldre spec utan clamp-baserade tokens.",
  });

  // v6 gate — a section that renders nothing at all is a visual hole on mobile.
  const emptySection = spec.sections.find(
    (s) =>
      s.type !== "hero" &&
      s.type !== "contact" &&
      !s.title &&
      !s.body &&
      !(s.items || []).length &&
      !(s.images || []).length,
  );
  checks.push({
    id: "section-content",
    label: "Inga tomma sektioner",
    level: emptySection ? "fail" : "pass",
    detail: emptySection ? `Sektionen "${emptySection.id}" saknar innehåll.` : undefined,
  });

  // v6 gate — media must come from customer uploads or the curated library,
  // never a remote/unknown origin that can break or leak a tool screenshot.
  const external = spec.images.find(
    (i) => i.role !== "reject" && /^(https?:)?\/\//i.test(i.path || ""),
  );
  checks.push({
    id: "asset-origin",
    label: "Säkra bildkällor",
    level: external ? "fail" : "pass",
    detail: external ? `Extern bildlänk: ${external.path}` : undefined,
  });

  // v6 gate — very long unbroken tokens anywhere in body copy overflow at 375px.
  const longestBodyWord = spec.sections
    .flatMap((s) => [s.body || "", ...(s.items || []).flatMap((i) => [i.title, i.body || ""])])
    .flatMap((t) => t.split(/\s+/))
    .find((w) => w.length > 28);
  checks.push({
    id: "overflow-body",
    label: "Ingen överflödsrisk i text",
    level: longestBodyWord ? "warn" : "pass",
    detail: longestBodyWord ? `Långt ord i brödtext: "${longestBodyWord}"` : undefined,
  });

  const fails = checks.filter((c) => c.level === "fail").length;
  const warns = checks.filter((c) => c.level === "warn").length;
  const score = Math.max(0, Math.round(100 - fails * 22 - warns * 6));
  const status: QaReport["status"] = fails > 0 ? "blocked" : warns > 2 ? "review" : "ready";

  return { score, status, checks, evaluatedAt: new Date().toISOString() };
}

/**
 * Single source of truth for whether a generated preview may be emailed.
 * blocked -> never. review -> only after explicit admin acceptance. ready -> yes.
 */
export function previewSendGate(
  qa: Pick<QaReport, "status" | "checks"> | null | undefined,
  accepted: boolean,
): { sendable: boolean; reason?: string } {
  const status = qa?.status;
  if (status === "blocked") {
    const failed = (qa?.checks || []).filter((c) => c.level === "fail").map((c) => c.label);
    return {
      sendable: false,
      reason: `Kvalitetskontrollen blockerar previewen${failed.length ? `: ${failed.join(", ")}` : ""}.`,
    };
  }
  if (status === "review" && !accepted) {
    return {
      sendable: false,
      reason: "Previewen har varningar och måste godkännas av admin innan den skickas.",
    };
  }
  return { sendable: true };
}

