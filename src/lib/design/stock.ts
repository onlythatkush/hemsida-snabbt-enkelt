import type { IndustryId } from "./types";
import { type StockSetId, stockSetFor } from "./stock-map";

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

const SETS: Record<StockSetId, string[]> = {
  sweets: [sweets1, sweets2, sweets3],
  food: [food1, food2, retail2],
  retail: [retail1, retail2, professional1],
  trade: [trade1, trade2, professional1],
  professional: [professional1, professional2, trade2],
  wellness: [wellness1, wellness2, retail1],
};

/** Deterministic list of fallback photos so a generated page is never text-only. */
export function stockImages(set?: string | null, industry?: IndustryId): string[] {
  const key = (set && (SETS as Record<string, string[]>)[set] ? set : stockSetFor(industry || "generic")) as StockSetId;
  return SETS[key];
}

export { stockSetFor };
export type { StockSetId };
