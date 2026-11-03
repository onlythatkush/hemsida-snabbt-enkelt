import type { IndustryId, Tone } from "./types";

export const INDUSTRY_KEYWORDS: Record<IndustryId, string[]> = {
  bakery: ["bageri", "konditori", "hembakat", "hembakad", "bakverk", "bakar", "kakor", "kaka", "tårta", "tårtor", "bulle", "bullar", "godis", "praliner", "choklad", "sylt", "surdeg", "bröd", "fika", "sweets", "candy", "tårtbageri", "bageributik", "konditor", "bakelse", "brödbutik", "chokladbutik"],
  cafe: ["café", "cafe", "kafé", "fik", "kaffe", "espresso", "lunchcafé", "kaffebar", "kaffestuga", "fika", "caféverksamhet", "espressobar"],
  restaurant: ["restaurang", "pizzeria", "meny", "bistro", "krog", "sushi", "kök", "matsal", "catering", "food truck", "hamburgerrestaurang", "grill", "foodtruck", "takeaway", "matservering", "lunchrestaurang", "thai", "pizza", "kebab"],
  ecommerce: ["webshop", "webbshop", "e-handel", "ehandel", "onlinebutik", "produkter online", "sälja online", "shop", "dropshipping", "nätbutik", "webbutik", "säljer via nätet", "digital butik"],
  retail: ["butik", "blomsterhandel", "blommor", "gårdsbutik", "second hand", "inredningsbutik", "loppis", "klädbutik", "presentbutik", "modebutik", "blomsterbutik", "butiksförsäljning", "optiker", "cykelbutik"],
  legal: ["jurist", "juridik", "advokat", "advokatbyrå", "familjerätt", "avtal", "rådgivning juridik", "revisor", "redovisning", "bokföring", "ekonomibyrå", "advokatkontor", "juristbyrå", "redovisningsbyrå", "bokslut", "skatterådgivning", "ekonomikonsult"],
  consulting: ["konsult", "konsultbolag", "rådgivning", "strategi", "projektledning", "it-konsult", "utveckling", "byrå", "coachning för företag", "managementkonsult", "it-bolag", "marknadsföringsbyrå", "digitalbyrå", "affärsutveckling", "webbyrå", "reklambyrå"],
  beauty: ["salong", "frisör", "frisörsalong", "naglar", "nagelteknolog", "skönhet", "hudvård", "make-up", "barberare", "fransar", "fransförlängning", "nagelsalong", "skönhetssalong", "hårsalong", "hudterapeut", "bryn", "lash lift"],
  health: ["massage", "spa", "yoga", "terapi", "terapeut", "psykolog", "naprapat", "kiropraktor", "hälsa", "vård", "klinik", "tandläkare", "fotvård", "fysioterapeut", "sjukgymnast", "vårdcentral", "psykoterapi", "hälsoklinik", "osteopat", "akupunktur"],
  construction: ["bygg", "byggfirma", "snickeri", "snickare", "elektriker", "el-firma", "rörmokare", "vvs", "målare", "takläggare", "entreprenad", "mark", "renovering", "byggföretag", "byggentreprenör", "plattsättare", "murare", "golvläggare", "målerifirma", "takfirma", "grävarbeten", "anläggningsfirma"],
  fitness: ["gym", "träning", "pt", "personlig tränare", "crossfit", "träningsstudio", "träningscenter", "yogastudio", "pilates", "personlig träning", "boxningsklubb", "idrottsförening"],
  photography: ["fotograf", "foto", "bröllopsfotograf", "film", "videoproduktion", "fotostudio", "porträttfotograf", "videograf", "drönarfoto", "produktfoto"],
  cleaning: ["städ", "städfirma", "flyttstäd", "hemstäd", "fönsterputs", "lokalvård", "kontorsstäd", "städservice", "städtjänster", "trappstäd", "industristäd", "hemservice"],
  // "uthyrning" alone is ambiguous (cars, tools, venues) — it must be tied to housing.
  realestate: ["mäklare", "fastighetsmäklare", "fastighetsbolag", "bostadsrätt", "bostäder", "lägenheter", "hyresrätter", "uthyrning av bostad", "uthyrning av lägenhet", "villa till salu", "fastighetsförvaltning", "bostadsförmedling", "mäklarfirma", "husförsäljning", "hyresfastigheter"],
  events: ["event", "bröllop", "fest", "konferens", "uthyrning av lokal", "dj", "artist", "band", "eventbyrå", "festlokal", "eventplanering", "ljud och ljus", "bröllopsplanerare", "konsertarrangör"],
  automotive: ["bilverkstad", "bilservice", "verkstad för bilar", "mekaniker", "däckbyte", "däckhotell", "bilrekond", "bilrekonditionering", "rekond", "rekondmästare", "rekonditionering", "biltvätt", "fordonstvätt", "bilvård", "ac-service", "fordon", "lastbil", "mc-verkstad", "bilplåt", "besiktningshjälp", "bilhandlare", "bilfirma", "bilhandel", "bilförsäljning", "begagnade bilar", "premiumbilar", "lyxbilar", "sportbil", "sportbilar", "exklusiva bilar", "motor", "biluthyrning", "hyrbil", "hyrbilar", "hyra bil", "hyra ut bilar", "uthyrning av bilar", "biluthyrare", "car rental", "rental cars", "premium cars", "luxury cars", "bilar", "bilrekonditionering", "rekonditionering", "rekondmästare", "bilspa", "car detailing", "detailing", "polering av bil", "lackskydd", "keramiskt lackskydd", "biltvätt", "handtvätt", "fordonstvätt", "däckverkstad", "bilglas", "bilmekaniker", "bilreparation", "fordonsverkstad", "bilverkstad", "lastbilsverkstad"],
  hospitality: ["hotell", "bed and breakfast", "b&b", "vandrarhem", "pensionat", "stugor", "stuguthyrning", "boende", "övernattning", "gästhus", "rum med frukost", "hotellverksamhet", "stugby", "semesterboende", "camping", "bed and breakfast", "vandrarhem", "hotellrum"],
  generic: [],
};

export type ToneWord = { words: string[]; effect: Partial<Tone> };

export const TONE_WORDS: ToneWord[] = [
  { words: ["jordnära", "genuin", "genuint", "äkta", "hantverk", "hantverksmässig", "hemlagat", "hembakat", "närodlat", "lokala råvaror", "ekologisk", "naturlig", "rustik", "traditionell", "gammaldags"], effect: { warmth: 0.28, craft: 0.3, formality: -0.1 } },
  { words: ["hemtrevlig", "hemtrevligt", "familjär", "familjärt", "familjeföretag", "mysig", "mysigt", "varm", "varmt", "personlig", "personligt", "välkomnande", "nära"], effect: { warmth: 0.3, formality: -0.15, playfulness: 0.08 } },
  { words: ["premium", "exklusiv", "exklusivt", "lyxig", "high-end", "elegant", "sofistikerad", "stilren lyx"], effect: { formality: 0.3, density: 0.12, warmth: -0.05 } },
  { words: ["professionell", "seriös", "trygg", "pålitlig", "förtroende", "erfaren", "etablerad"], effect: { formality: 0.25 } },
  { words: ["modern", "modernt", "minimalistisk", "minimalistiskt", "stilren", "stilrent", "clean", "avskalad", "enkel design", "skandinavisk"], effect: { density: -0.2, formality: 0.12, craft: -0.1 } },
  { words: ["lekfull", "lekfullt", "färgglad", "färgglatt", "roligt", "glad", "energisk", "ungdomlig", "peppig"], effect: { playfulness: 0.32, warmth: 0.1, formality: -0.15 } },
  { words: ["lugn", "lugnt", "harmonisk", "avkopplande", "mjuk", "mjukt", "välbefinnande", "balans"], effect: { warmth: 0.15, playfulness: -0.05, density: -0.12 } },
  { words: ["kraftfull", "tuff", "robust", "stark", "industriell", "rå"], effect: { formality: 0.1, playfulness: -0.1, density: 0.18, warmth: -0.15 } },
  { words: ["mörk", "mörkt", "dark mode", "nattkänsla", "svart bakgrund"], effect: { formality: 0.15, warmth: -0.25 } },
  { words: ["ljus", "ljust", "luftig", "luftigt", "fräsch", "fräscht"], effect: { warmth: 0.08, density: -0.15 } },
];

export const LOCAL_WORDS = ["lokal", "lokala", "lokalt", "närproducerat", "närodlat", "bygden", "orten", "trakten", "blekinge", "skåne", "småland", "dalarna", "norrland", "gotland", "värmland", "halland", "bohuslän", "kommun"];

export function normalize(text: string) {
  return text.toLowerCase().replace(/\s+/g, " ");
}

/**
 * Prioritize the applicant's explicit website category, then their business
 * description, then supplementary wishes and name. Match whole phrases instead
 * of arbitrary substrings ("spa" must not match "bilspa").
 */
export function detectIndustry(...texts: (string | null | undefined)[]): { industry: IndustryId; score: number } {
  const inputs = texts.map((value) => normalize(value || ""));
  const weights = [5, 3, 1, 1];
  const scores = new Map<IndustryId, number>();
  const specialist: Partial<Record<IndustryId, RegExp[]>> = {
    automotive: [/\\b(?:bil|fordon|auto)(?:rekond|tvätt|vård|service|verkstad|handel|försäljning|uthyrning|spa)\\b/u, /\\brekond(?:itionering|mästare)?\\b/u, /\\b(?:car detailing|detailing|lackskydd|bilpolering)\\b/u],
    construction: [/\\b(?:bygg|snickeri|el|vvs|tak|måleri)(?:firma|företag|service|entreprenad)\\b/u],
    cleaning: [/\\b(?:städ|rengöring)(?:firma|företag|service|tjänst|ning)?\\b/u],
    beauty: [/\\b(?:frisör|nagel|skönhets|frans)(?:salong|studio|vård|förlängning)?\\b/u],
  };
  for (const [industry, words] of Object.entries(INDUSTRY_KEYWORDS) as [IndustryId, string[]][]) {
    if (industry === "generic") continue;
    let score = 0;
    inputs.forEach((input, index) => {
      if (!input) return;
      const weight = weights[index] ?? 1;
      const padded = " " + input.replace(/[^\\p{L}\\p{N}]+/gu, " ") + " ";
      for (const word of new Set(words)) {
        const phrase = " " + normalize(word).replace(/[^\\p{L}\\p{N}]+/gu, " ") + " ";
        if (padded.includes(phrase)) score += weight * (word.length >= 7 ? 3 : 2);
      }
      for (const pattern of specialist[industry] || []) {
        if (pattern.test(input)) score += weight * 12;
      }
    });
    scores.set(industry, score);
  }
  const ranked = [...scores.entries()].sort((a, b) => b[1] - a[1]);
  const [industry, score] = ranked[0] || ["generic", 0];
  return { industry: score > 0 ? industry : "generic", score };
}

export function detectTone(...texts: (string | null | undefined)[]): { tone: Tone; matched: string[] } {
  const haystack = normalize(texts.filter(Boolean).join(" "));
  const tone: Tone = { warmth: 0.5, formality: 0.5, playfulness: 0.35, density: 0.5, craft: 0.35 };
  const matched: string[] = [];
  for (const group of TONE_WORDS) {
    const hit = group.words.find((w) => haystack.includes(w));
    if (!hit) continue;
    matched.push(hit);
    for (const [key, value] of Object.entries(group.effect)) {
      const k = key as keyof Tone;
      tone[k] = Math.min(1, Math.max(0, tone[k] + (value as number)));
    }
  }
  return { tone, matched };
}

export function isLocal(...texts: (string | null | undefined)[]) {
  const haystack = normalize(texts.filter(Boolean).join(" "));
  return LOCAL_WORDS.some((w) => haystack.includes(w));
}
