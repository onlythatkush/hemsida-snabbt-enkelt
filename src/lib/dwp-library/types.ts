/** DWP Premium Design Library – shared, framework-agnostic data contracts. */

/** Visual style = theme tokens ([data-dwp-theme] in styles.css) + matching hero treatment. */
export type ThemeId = "noir" | "warm" | "blueprint" | "nordic" | "signal";
export type HeroVariant = "cinematic" | "editorial" | "architectural" | "split" | "bold";

/** Content archetype decides which conversion section is rendered. */
export type Archetype = "quote" | "appointment" | "package" | "product" | "property";

export type Category = "Hantverk" | "Hem & service" | "Fordon" | "Skönhet & hälsa" | "Mat & dryck" | "Företag" | "Fastighet & handel";

export interface Img { src: string; alt: string }
export interface Service { title: string; text: string; image: Img }
export interface Project { title: string; meta: string; image: Img }
export interface PriceRow { name: string; price: string; note?: string }
export interface PriceTier { name: string; price: string; features: string[]; featured?: boolean }
export interface Product { name: string; desc: string; price: string; image?: Img }
export interface Listing { title: string; meta: string; price: string; status: string; image: Img }
export interface Reference { quote: string; author: string }

export type Offer =
  | { kind: "quote"; heading: string; projects: Project[]; credentials: string[] }
  | { kind: "appointment"; heading: string; rows: PriceRow[] }
  | { kind: "package"; heading: string; tiers: PriceTier[]; unit?: string }
  | { kind: "product"; heading: string; items: Product[] }
  | { kind: "property"; heading: string; listings: Listing[] };

export interface Site {
  id: string;
  industry: string; // Swedish industry label, e.g. "Elektriker"
  category: Category;
  archetype: Archetype;
  theme: ThemeId;
  hero: { variant: HeroVariant; eyebrow: string; title: string; lead: string; cta: string; secondary?: string; image: Img };
  brand: string;
  accent?: string; // optional CSS colour overriding --dwp-accent
  services: { heading: string; items: Service[] };
  offer: Offer;
  references: Reference[];
  contact: { heading: string; text: string; phone: string; address: string };
}