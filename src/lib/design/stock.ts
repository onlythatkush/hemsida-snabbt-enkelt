import type { IndustryId } from "./types";
import { type StockSetId, allowedSetsFor, stockSetFor } from "./stock-map";

import sweets1 from "@/assets/stock/sweets-1.jpg";
import sweets2 from "@/assets/stock/sweets-2.jpg";
import sweets3 from "@/assets/stock/sweets-3.jpg";
import food1 from "@/assets/stock/food-1.jpg";
import food2 from "@/assets/stock/food-2.jpg";
import retail1 from "@/assets/stock/retail-1.jpg";
import retail2 from "@/assets/stock/retail-2.jpg";
import trade1 from "@/assets/stock/trade-1.jpg";
import trade2 from "@/assets/stock/trade-2.jpg";
import professional1 from "@/assets/stock/professional-1.jpg";
import professional2 from "@/assets/stock/professional-2.jpg";
import wellness1 from "@/assets/stock/wellness-1.jpg";
import wellness2 from "@/assets/stock/wellness-2.jpg";
import auto1 from "@/assets/stock/auto-1.jpg";
import auto2 from "@/assets/stock/auto-2.jpg";
import auto3 from "@/assets/stock/auto-3.jpg";

type StockPhoto = { src: string; tags: string[] };

/**
 * Curated fallback photography. Every set only contains media that is on-topic
 * for its industry — a car page must never fall back to kitchens or trades.
 */
const SETS: Record<StockSetId, StockPhoto[]> = {
  sweets: [
    { src: sweets1, tags: ["food", "bakery", "interior"] },
    { src: sweets2, tags: ["food", "bakery"] },
    { src: sweets3, tags: ["food", "bakery"] },
  ],
  food: [
    { src: food1, tags: ["food", "restaurant"] },
    { src: food2, tags: ["food", "restaurant", "interior"] },
    { src: sweets1, tags: ["food", "interior"] },
  ],
  retail: [
    { src: retail1, tags: ["retail", "interior"] },
    { src: retail2, tags: ["retail", "products"] },
    { src: professional1, tags: ["people", "retail"] },
  ],
  trade: [
    { src: trade1, tags: ["workshop", "people"] },
    { src: trade2, tags: ["workshop"] },
    { src: professional2, tags: ["people", "workshop"] },
  ],
  professional: [
    { src: professional1, tags: ["people", "office"] },
    { src: professional2, tags: ["people", "office"] },
    { src: retail2, tags: ["office", "products"] },
  ],
  wellness: [
    { src: wellness1, tags: ["wellness", "interior"] },
    { src: wellness2, tags: ["wellness", "people"] },
    { src: retail1, tags: ["wellness", "interior"] },
  ],
  auto: [
    { src: auto1, tags: ["cars", "city", "night", "luxury"] },
    { src: auto2, tags: ["cars", "luxury", "night", "detail"] },
    { src: auto3, tags: ["cars", "interior", "city", "night", "luxury"] },
  ],
};

function resolveSet(set?: string | null, industry?: IndustryId): StockSetId {
  const wanted = (set && (SETS as Record<string, StockPhoto[]>)[set] ? set : null) as StockSetId | null;
  const fallback = stockSetFor(industry || "generic");
  // A stored set that is irrelevant for the industry is ignored — relevance wins.
  if (wanted && industry && !allowedSetsFor(industry).includes(wanted)) return fallback;
  return wanted || fallback;
}

/**
 * Deterministic list of fallback photos so a generated page is never text-only.
 * `prefer` are art-direction subjects ("cars", "night", ...) that float the most
 * relevant photos to the front so the hero embodies the customer's wishes.
 */
export function stockImages(set?: string | null, industry?: IndustryId, prefer: string[] = []): string[] {
  const photos = SETS[resolveSet(set, industry)];
  if (!prefer.length) return photos.map((p) => p.src);
  const scored = photos
    .map((photo, index) => ({
      photo,
      index,
      score: photo.tags.filter((t) => prefer.includes(t)).length,
    }))
    .sort((a, b) => b.score - a.score || a.index - b.index);
  return scored.map((s) => s.photo.src);
}

export { stockSetFor, allowedSetsFor };
export type { StockSetId };
