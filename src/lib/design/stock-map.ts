import type { IndustryId } from "./types";

export type StockSetId = "sweets" | "food" | "retail" | "trade" | "professional" | "wellness" | "auto";

const BY_INDUSTRY: Record<IndustryId, StockSetId> = {
  bakery: "sweets",
  cafe: "sweets",
  restaurant: "food",
  ecommerce: "retail",
  retail: "retail",
  legal: "professional",
  consulting: "professional",
  beauty: "wellness",
  health: "wellness",
  fitness: "wellness",
  construction: "trade",
  cleaning: "trade",
  realestate: "professional",
  photography: "professional",
  events: "professional",
  automotive: "auto",
  hospitality: "wellness",
  generic: "professional",
};

export function stockSetFor(industry: IndustryId): StockSetId {
  return BY_INDUSTRY[industry] || "professional";
}

/** Which curated sets are acceptable for an industry — used by the quality gate. */
export function allowedSetsFor(industry: IndustryId): StockSetId[] {
  const primary = stockSetFor(industry);
  if (industry === "automotive") return ["auto"];
  if (industry === "bakery" || industry === "cafe") return ["sweets", "food"];
  if (industry === "restaurant") return ["food", "sweets"];
  return [primary, "professional"];
}
