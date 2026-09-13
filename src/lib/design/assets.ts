import type { SpecImage } from "./types";

const IMAGE_RE = /\.(jpe?g|png|webp|gif|avif|svg)$/i;
const LOGO_RE = /(logo|logga|logotyp|brandmark|wordmark|symbol|ikon|icon|favicon)/i;
const HERO_RE = /(hero|framsida|omslag|banner|huvud|cover|forsida|förstasida|start)/i;
const SHOWCASE_RE = /(produkt|meny|bakverk|tavla|projekt|interior|interiör|lokal|butik|team|personal|bil|car)/i;

/**
 * Assets that must never become website media: screenshots of apps, admin
 * panels, dashboards, deploy tools or documents-as-images. A customer often
 * uploads a screenshot as a reference or a bug report — it is not photography
 * for their website and looked catastrophic when it landed in the hero.
 */
const SCREENSHOT_RE =
  /(sk[äa]rmavbild|sk[äa]rmdump|sk[äa]rmklipp|screen[\s_-]?shot|screenshot|screen[\s_-]?capture|cleanshot|snipaste|bildsk[äa]rm|skarmbild)/i;
const UI_ASSET_RE =
  /(vercel|lovable|supabase|netlify|cloudflare|github|dashboard|instrumentpanel|adminpanel|admin[\s_-]?panel|console|backend|deploy|analytics|localhost|browser|webbl[äa]sare|figma|wireframe|error|fel(?:medd|kod)|faktura|kvitto)/i;
// Apple/Android/Windows default screenshot filenames, e.g. "Screenshot_2026-09-13-22-12".
const SCREENSHOT_NAME_RE = /^(sk[äa]rmavbild|screenshot|screen[\s_-]?shot|bild)[\s_-]?\d{2,4}[-_ ]\d{1,2}/i;

export function isScreenshotLike(name: string): boolean {
  const n = String(name || "");
  return SCREENSHOT_RE.test(n) || SCREENSHOT_NAME_RE.test(n) || UI_ASSET_RE.test(n);
}

/**
 * Classifies customer uploads so their own material is always used first and
 * placed intentionally: logo to the brand bar, best photo to the hero, the next
 * few to feature blocks, the rest to the gallery, documents to the file list.
 * Screenshot/UI-like uploads are rejected and never rendered.
 */
export function planAssets(fileNames: string[]): {
  images: SpecImage[];
  logoIndex: number | null;
  photoCount: number;
  rejected: string[];
} {
  const photos: SpecImage[] = [];
  const docs: SpecImage[] = [];
  const logos: SpecImage[] = [];
  const rejects: SpecImage[] = [];

  for (const path of (fileNames || []).slice(0, 16)) {
    const name = String(path).split("/").pop() || "Fil";
    if (!IMAGE_RE.test(name)) {
      docs.push({ path, name, role: "doc" });
      continue;
    }
    if (isScreenshotLike(name)) {
      rejects.push({ path, name, role: "reject" });
      continue;
    }
    if (LOGO_RE.test(name) || /\.svg$/i.test(name)) {
      logos.push({ path, name, role: "logo" });
      continue;
    }
    photos.push({ path, name, role: "gallery" });
  }

  const score = (img: SpecImage) => {
    const n = img.name.toLowerCase();
    let s = 0;
    if (HERO_RE.test(n)) s += 5;
    if (SHOWCASE_RE.test(n)) s += 1;
    return s;
  };

  const sorted = [...photos].sort((a, b) => score(b) - score(a));
  sorted.forEach((img, index) => {
    img.role = index === 0 ? "hero" : index < 4 ? "feature" : "gallery";
  });

  // Only the first logo is treated as branding; extra marks become gallery art.
  const primaryLogo = logos.slice(0, 1);
  const extraLogos = logos.slice(1).map((l) => ({ ...l, role: "gallery" as const }));

  // Rejected assets stay last so they are visible in diagnostics but can never
  // be picked up by a section (sections select strictly by role).
  const images = [...primaryLogo, ...sorted, ...extraLogos, ...docs, ...rejects];
  const logoIndex = primaryLogo.length ? 0 : null;

  return { images, logoIndex, photoCount: sorted.length + extraLogos.length, rejected: rejects.map((r) => r.name) };
}
