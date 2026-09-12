import type { IndustryId } from "./types";

export type StockSetId = "sweets" | "food" | "retail" | "trade" | "professional" | "wellness";

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
  realestate: "trade",
  photography: "professional",
  events: "professional",
  generic: "professional",
};

export function stockSetFor(industry: IndustryId): StockSetId {
  return BY_INDUSTRY[industry] || "professional";
}
