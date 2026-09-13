import type { IndustryId, Tone } from "./types";

export function sentences(text: string): string[] {
  return text
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 2);
}

export function firstSentences(text: string, count: number): string {
  const list = sentences(text);
  if (!list.length) return "";
  return list.slice(0, count).join(" ");
}

export function restSentences(text: string, skip: number): string {
  const list = sentences(text);
  return list.slice(skip).join(" ");
}

const TAGLINES: Record<IndustryId, string[]> = {
  bakery: ["Bakat med omsorg, varje dag", "Hantverk från vårt kök till ditt bord", "Små satser, stor smak"],
  cafe: ["Ditt kvarterscafé", "Kaffe, fika och lugn stund", "En paus värd att ta"],
  restaurant: ["Mat med känsla", "Smaker att komma tillbaka till", "Välkommen till bords"],
  ecommerce: ["Handla enkelt online", "Utvalt sortiment, snabb leverans", "Allt du behöver, ett klick bort"],
  retail: ["Din lokala butik", "Noga utvalt sortiment", "Handla nära dig"],
  legal: ["Trygg rådgivning när det gäller", "Kunskap du kan luta dig mot", "Vi står vid din sida"],
  consulting: ["Rådgivning som ger resultat", "Vi hjälper dig framåt", "Erfarenhet du kan bygga på"],
  beauty: ["Tid för dig", "Omsorg från topp till tå", "Din stund av lyx"],
  health: ["Omtanke i varje möte", "För kropp och sinne", "Här får du landa"],
  construction: ["Gjort på riktigt", "Hantverk du kan lita på", "Från idé till färdigt"],
  fitness: ["Träna på dina villkor", "Starkare varje vecka", "Din träning, vårt fokus"],
  photography: ["Bilder som stannar kvar", "Ögonblick värda att spara", "Berättat i bild"],
  cleaning: ["Rent och klart", "Vi tar hand om städningen", "Mer tid över till annat"],
  realestate: ["Hem som passar dig", "Trygg affär hela vägen", "Vi kan din marknad"],
  events: ["Stunder att minnas", "Vi fixar helheten", "Ett event i stil"],
  automotive: ["Bilen i trygga händer", "Service utan krångel", "Vi kan fordon"],
  hospitality: ["En stund bort från vardagen", "Sov gott, vakna utvilad", "Ditt andra hem"],
  generic: ["Nära, enkelt och personligt", "Vi gör jobbet ordentligt", "Kvalitet i varje detalj"],
};

const HERO_TITLES: Record<IndustryId, (c: string) => string[]> = {
  bakery: (c) => [`Hembakat med hjärtat hos ${c}`, `Bakverk från ${c}`, `${c} — nybakat varje dag`],
  cafe: (c) => [`Slå dig ner hos ${c}`, `${c} — fika i lugn och ro`],
  restaurant: (c) => [`Välkommen till ${c}`, `${c} — mat med känsla`],
  ecommerce: (c) => [`Handla hos ${c}`, `${c} — noga utvalt sortiment`],
  retail: (c) => [`${c} — din butik på orten`, `Kika in hos ${c}`],
  legal: (c) => [`${c} — juridisk hjälp du kan lita på`, `Trygg rådgivning från ${c}`],
  consulting: (c) => [`${c} hjälper er framåt`, `${c} — rådgivning som ger effekt`],
  beauty: (c) => [`Din stund hos ${c}`, `${c} — omsorg och stil`],
  health: (c) => [`Hitta balansen med ${c}`, `${c} — omtanke i varje möte`],
  construction: (c) => [`${c} — hantverk du kan lita på`, `Från idé till färdigt med ${c}`],
  fitness: (c) => [`Träna med ${c}`, `${c} — starkare tillsammans`],
  photography: (c) => [`Bilder av ${c}`, `${c} fångar ögonblicket`],
  cleaning: (c) => [`${c} — rent och klart`, `Låt ${c} sköta städningen`],
  realestate: (c) => [`${c} — hem som passar dig`, `Trygg bostadsaffär med ${c}`],
  events: (c) => [`${c} skapar stunden`, `Event med ${c}`],
  automotive: (c) => [`${c} — bilen i trygga händer`, `Service och reparation hos ${c}`],
  hospitality: (c) => [`Välkommen till ${c}`, `${c} — en stund bort från vardagen`],
  generic: (c) => [`Välkommen till ${c}`, `${c} — nära och personligt`],
};

export function pick<T>(list: T[], seed: number): T {
  return list[Math.abs(seed) % list.length];
}

/** Luxury car rental reads nothing like a workshop, so it gets its own voice. */
const isLuxuryRental = (industry: IndustryId, subjects: string[] = []) =>
  industry === "automotive" && subjects.includes("rental");

export function tagline(industry: IndustryId, seed: number, subjects: string[] = []) {
  if (isLuxuryRental(industry, subjects)) {
    return pick(["Kör något exceptionellt", "Premiumbilar när du vill", "Lyx på fyra hjul"], seed);
  }
  return pick(TAGLINES[industry] || TAGLINES.generic, seed);
}

export function heroTitle(industry: IndustryId, company: string, seed: number, subjects: string[] = []) {
  if (isLuxuryRental(industry, subjects)) {
    return pick(
      [`${company} — premiumbilar att hyra`, `Hyr lyxbilen hos ${company}`, `${company}. Kör i en klass för sig`],
      seed,
    );
  }
  const list = (HERO_TITLES[industry] || HERO_TITLES.generic)(company);
  return pick(list, seed);
}

export function ctaPrimary(industry: IndustryId, tone: Tone, subjects: string[] = []) {
  if (isLuxuryRental(industry, subjects)) return "Boka din bil";
  if (industry === "ecommerce" || industry === "retail") return "Till butiken";
  if (industry === "bakery") return tone.warmth > 0.7 ? "Beställ hos oss" : "Se utbudet";
  if (industry === "restaurant" || industry === "cafe") return "Boka bord";
  if (industry === "beauty" || industry === "health" || industry === "fitness") return "Boka tid";
  if (industry === "construction" || industry === "cleaning") return "Begär offert";
  if (industry === "legal" || industry === "consulting" || industry === "realestate") return "Boka ett möte";
  if (industry === "automotive") return "Boka verkstadstid";
  if (industry === "hospitality") return "Boka ditt rum";
  return tone.formality > 0.7 ? "Kontakta oss" : "Hör av dig";
}

export function ctaSecondary(tone: Tone) {
  return tone.warmth > 0.7 ? "Läs mer om oss" : "Våra tjänster";
}

export function heroSub(description: string, tone: Tone, local: boolean) {
  const lead = firstSentences(description, 2);
  if (lead) return lead;
  return local ? "Lokalt företag med personlig service." : tone.formality > 0.7 ? "Professionell hjälp anpassad efter dina behov." : "Vi hjälper dig gärna — hör av dig så tar vi det därifrån.";
}
