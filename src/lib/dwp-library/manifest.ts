/**
 * DWP Premium Design Library – manifest.
 *
 * Integrating in an external React/TypeScript app (e.g. the Din Webbpartner generator):
 *  1. Copy src/dwp/* and the [data-dwp-theme] block + .dwp-* classes from src/styles.css.
 *     Load fonts: Cormorant Garamond, Fraunces, Manrope, Inter Tight (Google Fonts).
 *  2. import { DwpPage } from "./dwp/components"; import { sites, siteById } from "./dwp/templates";
 *  3. Map your customer record to `Site` (see types.ts): start from the closest industry entry
 *     and override brand/hero/contact/services:
 *        const site: Site = { ...siteById("elektriker")!, brand: c.name, contact: { ...c.contact } };
 *        <DwpPage site={site} />
 *  4. Archetype controls the conversion section: "quote" industries never render price lists.
 */
import { sites } from "./templates";

export const manifest = {
  name: "DWP Premium Design Library",
  version: "2.0.0",
  language: "sv",
  entry: "src/dwp/components.tsx#DwpPage",
  themes: ["noir", "warm", "blueprint", "nordic", "signal"],
  heroVariants: ["cinematic", "editorial", "architectural", "split", "bold"],
  archetypes: {
    quote: "Projekt, certifieringar och offertförfrågan – inga prislistor",
    appointment: "Tidsbokning med demopriser per behandling/jobb",
    package: "Paket eller abonnemang (demopriser)",
    product: "Meny, produkter eller hyrbilar (demopriser)",
    property: "Lediga objekt med status",
  },
  sections: ["Hero", "Services", "Offer", "References", "Contact"],
  tokens: ["--dwp-bg", "--dwp-fg", "--dwp-surface", "--dwp-accent", "--dwp-accent-fg", "--dwp-line", "--dwp-font-display", "--dwp-font-body", "--dwp-radius"],
  industries: sites.map((s) => ({ id: s.id, industry: s.industry, category: s.category, archetype: s.archetype, theme: s.theme, hero: s.hero.variant, cta: s.hero.cta })),
} as const;