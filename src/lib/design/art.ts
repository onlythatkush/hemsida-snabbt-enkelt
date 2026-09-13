import type { ArtDirection, IndustryId } from "./types";

/**
 * Reads the customer's free-text wishes and turns them into concrete art
 * direction that steers family choice, hero composition and image selection —
 * instead of only being repeated back in a "Önskemål" section.
 */

type Cue = { subject: string; words: string[] };

const CUES: Cue[] = [
  { subject: "cars", words: ["bil", "bilar", "två bilar", "fordon", "sportbil", "sportbilar", "hyrbil", "biluthyrning", "car", "cars"] },
  { subject: "city", words: ["stad", "stadsljus", "city", "storstad", "skyline", "urban", "gata", "gator"] },
  { subject: "night", words: ["natt", "nattbild", "nattbilder", "nattkänsla", "mörk", "mörkt", "svart bakgrund", "dark mode", "kväll", "neon", "ljus i staden"] },
  { subject: "luxury", words: ["lyx", "lyxig", "lyxiga", "exklusiv", "exklusiva", "premium", "high-end", "elegant", "sofistikerad"] },
  { subject: "rental", words: ["hyr ut", "hyra", "uthyrning", "biluthyrning", "hyrbil", "hyrbilar", "leasing", "korttidshyra"] },
  { subject: "interior", words: ["interiör", "lokal", "salong", "butik", "matsal"] },
  { subject: "people", words: ["team", "personal", "kunder", "medarbetare"] },
  { subject: "food", words: ["mat", "bakverk", "tårta", "kaffe", "meny", "rätter"] },
  { subject: "nature", words: ["natur", "skog", "hav", "grönska"] },
  { subject: "workshop", words: ["verkstad", "bygge", "byggarbete", "hantverk på plats"] },
];

const HERO_WORDS = ["bakgrund", "bakgrundsbild", "hero", "startbild", "förstasidan", "framsida", "toppbild", "i bakgrunden"];

const NIGHT_SUBJECTS = new Set(["night", "city"]);

export function analyzeArt(
  industry: IndustryId,
  ...texts: (string | null | undefined)[]
): ArtDirection {
  const haystack = texts.filter(Boolean).join(" ").toLowerCase();
  const subjects: string[] = [];
  const keywords: string[] = [];

  for (const cue of CUES) {
    const hit = cue.words.find((w) => haystack.includes(w));
    if (!hit) continue;
    subjects.push(cue.subject);
    keywords.push(hit);
  }

  // The industry itself is always part of the art direction so media can never
  // drift away from what the business actually is.
  if (industry === "automotive" && !subjects.includes("cars")) subjects.unshift("cars");

  const night = subjects.some((s) => NIGHT_SUBJECTS.has(s)) && !haystack.includes("ljus och luftig");
  const requireHeroMedia = HERO_WORDS.some((w) => haystack.includes(w)) || subjects.includes("cars");

  return {
    subjects,
    keywords,
    mood: night ? "night" : haystack.includes("ljus") || haystack.includes("luftig") ? "bright" : "neutral",
    requireHeroMedia,
  };
}
