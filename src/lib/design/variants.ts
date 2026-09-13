import type { FamilyId, Variation } from "./types";

/**
 * Deterministic variation inside a family.
 *
 * The same customer always gets the same layout, but two customers in the same
 * industry get different hero alignment, section rhythm and gallery treatment
 * so generated sites never look cloned.
 */
const HERO_ALIGN: Variation["heroAlign"][] = ["left", "center"];
const GALLERY: Variation["galleryStyle"][] = ["mosaic", "even", "strip"];

/** Section ids that may be reordered; hero and contact stay pinned. */
const SWAPPABLE = ["about", "services", "highlight", "process", "why", "gallery", "local", "wishes"];

export function buildVariation(family: FamilyId, seed: number, sectionIds: string[]): Variation {
  const pick = <T,>(list: T[], salt: number): T => list[(seed + salt) % list.length];
  const rotation = seed % 3;

  const middle = sectionIds.filter((id) => SWAPPABLE.includes(id));
  const order = [...sectionIds];

  if (rotation === 1) swap(order, middle[1], middle[2]);
  if (rotation === 2) swap(order, middle[2], middle[3]);

  return {
    id: `${family}/v${rotation + 1}`,
    heroAlign: pick(HERO_ALIGN, 1),
    sectionOrder: order,
    cardColumns: (seed % 5 === 0 ? 2 : 3) as 2 | 3,
    galleryStyle: pick(GALLERY, 2),
    useStatementAccent: seed % 2 === 0,
  };
}

function swap(list: string[], a?: string, b?: string) {
  if (!a || !b) return;
  const i = list.indexOf(a);
  const j = list.indexOf(b);
  if (i < 0 || j < 0) return;
  [list[i], list[j]] = [list[j], list[i]];
}
