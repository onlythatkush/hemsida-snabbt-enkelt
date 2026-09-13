import type { SpecImage } from "./types";

const IMAGE_RE = /\.(jpe?g|png|webp|gif|avif|svg)$/i;
const LOGO_RE = /(logo|logga|logotyp|brandmark|wordmark|symbol|ikon|icon|favicon)/i;
const HERO_RE = /(hero|framsida|omslag|banner|huvud|cover|forsida|förstasida|start)/i;
const SHOWCASE_RE = /(produkt|meny|bakverk|tavla|projekt|interior|interiör|lokal|butik|team|personal|bil|car)/i;

/**
 * Classifies customer uploads so their own material is always used first and
 * placed intentionally: logo to the brand bar, best photo to the hero, the next
 * few to feature blocks, the rest to the gallery, documents to the file list.
 */
export function planAssets(fileNames: string[]): { images: SpecImage[]; logoIndex: number | null; photoCount: number } {
  const photos: SpecImage[] = [];
  const docs: SpecImage[] = [];
  const logos: SpecImage[] = [];

  for (const path of (fileNames || []).slice(0, 16)) {
    const name = String(path).split("/").pop() || "Fil";
    if (!IMAGE_RE.test(name)) {
      docs.push({ path, name, role: "doc" });
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

  const images = [...primaryLogo, ...sorted, ...extraLogos, ...docs];
  const logoIndex = primaryLogo.length ? 0 : null;

  return { images, logoIndex, photoCount: sorted.length + extraLogos.length };
}
