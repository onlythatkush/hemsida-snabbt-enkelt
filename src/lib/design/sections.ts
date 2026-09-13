import { firstSentences, restSentences, sentences } from "./copy";
import type { ArtDirection, IndustryId, Section, SectionItem, SpecImage, Tone } from "./types";

export type SectionContext = {
  art?: ArtDirection;
  industry: IndustryId;
  tone: Tone;
  local: boolean;
  company: string;
  description: string;
  extra?: string | null;
  images: SpecImage[];
  docCount: number;
  seed: number;
};

const OFFER_LABELS: Record<IndustryId, { eyebrow: string; title: string; items: SectionItem[] }> = {
  bakery: {
    eyebrow: "Vårt utbud",
    title: "Det vi bakar",
    items: [
      { title: "Bakverk & kakor", body: "Nybakat i små satser med noga valda råvaror." },
      { title: "Beställning till fest", body: "Tårtor och bakverk till kalas, bröllop och firmafest." },
      { title: "Säsongens smaker", body: "Utbudet följer årstiden och det som är bäst just nu." },
    ],
  },
  cafe: {
    eyebrow: "Hos oss",
    title: "Fika & lunch",
    items: [
      { title: "Kaffe & bryggmetoder", body: "Noga valda bönor, bryggt med omsorg." },
      { title: "Hembakat till kaffet", body: "Bakverk som byts av med säsongen." },
      { title: "Enkel lunch", body: "Något litet och gott mitt på dagen." },
    ],
  },
  restaurant: {
    eyebrow: "Menyn",
    title: "Det vi serverar",
    items: [
      { title: "Förrätter", body: "Små rätter att dela på." },
      { title: "Varmrätter", body: "Säsongsbetonat med råvaror vi tror på." },
      { title: "Efterrätter", body: "En sista söt avslutning." },
    ],
  },
  ecommerce: {
    eyebrow: "Sortiment",
    title: "Populära kategorier",
    items: [
      { title: "Nyheter", body: "Det senaste som kommit in." },
      { title: "Favoriter", body: "Det våra kunder handlar mest." },
      { title: "Snabb leverans", body: "Skickas inom ett par arbetsdagar." },
    ],
  },
  retail: {
    eyebrow: "I butiken",
    title: "Vårt sortiment",
    items: [
      { title: "Utvalt sortiment", body: "Noga valda produkter vi själva står för." },
      { title: "Personlig hjälp", body: "Vi hjälper dig hitta rätt." },
      { title: "Beställningar", body: "Vi tar gärna fram det du söker." },
    ],
  },
  legal: {
    eyebrow: "Vi hjälper till med",
    title: "Våra områden",
    items: [
      { title: "Rådgivning", body: "Genomgång av din situation och tydliga alternativ." },
      { title: "Avtal & handlingar", body: "Upprättande och granskning av dokument." },
      { title: "Löpande stöd", body: "Någon att ringa när det uppstår frågor." },
    ],
  },
  consulting: {
    eyebrow: "Tjänster",
    title: "Så kan vi hjälpa er",
    items: [
      { title: "Analys & nuläge", body: "Vi kartlägger var ni står idag." },
      { title: "Genomförande", body: "Vi arbetar tillsammans med er organisation." },
      { title: "Uppföljning", body: "Vi mäter effekten och justerar." },
    ],
  },
  beauty: {
    eyebrow: "Behandlingar",
    title: "Det vi erbjuder",
    items: [
      { title: "Klippning & styling", body: "Anpassat efter dig och ditt hår." },
      { title: "Färg & behandling", body: "Varsamma produkter och tydligt resultat." },
      { title: "Boka tid", body: "Enkelt att boka, lätt att komma till." },
    ],
  },
  health: {
    eyebrow: "Behandlingar",
    title: "Det vi erbjuder",
    items: [
      { title: "Första besöket", body: "Vi går igenom din situation i lugn takt." },
      { title: "Behandling", body: "Anpassad efter dina behov och mål." },
      { title: "Uppföljning", body: "Vi följer upp så att du känner skillnad." },
    ],
  },
  construction: {
    eyebrow: "Tjänster",
    title: "Det vi utför",
    items: [
      { title: "Nybyggnation", body: "Från grund till nyckelfärdigt." },
      { title: "Renovering", body: "Kök, badrum och helrenoveringar." },
      { title: "Service & mindre jobb", body: "Vi tar oss an även de små uppdragen." },
    ],
  },
  fitness: {
    eyebrow: "Träning",
    title: "Så tränar du hos oss",
    items: [
      { title: "Egen träning", body: "Fria vikter och maskiner." },
      { title: "Personlig träning", body: "Upplägg som passar din vardag." },
      { title: "Gruppass", body: "Träna tillsammans med andra." },
    ],
  },
  photography: {
    eyebrow: "Uppdrag",
    title: "Det jag fotograferar",
    items: [
      { title: "Porträtt", body: "Naturliga bilder i avslappnad miljö." },
      { title: "Event & bröllop", body: "Hela dagen fångad i bild." },
      { title: "Företag", body: "Bilder till hemsida och sociala medier." },
    ],
  },
  cleaning: {
    eyebrow: "Tjänster",
    title: "Det vi städar",
    items: [
      { title: "Hemstädning", body: "Återkommande städning efter ditt schema." },
      { title: "Flyttstädning", body: "Med garanti och noggrann checklista." },
      { title: "Lokalvård", body: "För kontor och verksamheter." },
    ],
  },
  realestate: {
    eyebrow: "Tjänster",
    title: "Så arbetar vi",
    items: [
      { title: "Värdering", body: "Kostnadsfri bedömning av din bostad." },
      { title: "Försäljning", body: "Vi sköter hela processen." },
      { title: "Rådgivning", body: "Trygga svar hela vägen." },
    ],
  },
  events: {
    eyebrow: "Vi ordnar",
    title: "Våra tjänster",
    items: [
      { title: "Planering", body: "Vi tar fram upplägget tillsammans." },
      { title: "Genomförande", body: "Vi finns på plats hela dagen." },
      { title: "Helhet", body: "Mat, teknik och dekor på ett ställe." },
    ],
  },
  automotive: {
    eyebrow: "Verkstaden",
    title: "Det vi utför",
    items: [
      { title: "Service & reparation", body: "Alla märken, med originaldelar eller likvärdigt." },
      { title: "Däck & hjulskifte", body: "Snabbt byte och förvaring över säsongen." },
      { title: "Felsökning", body: "Vi läser av felkoder och förklarar vad som gäller." },
    ],
  },
  hospitality: {
    eyebrow: "Ditt boende",
    title: "Hos oss",
    items: [
      { title: "Rummen", body: "Personligt inredda rum med lugn utsikt." },
      { title: "Frukost", body: "Hemlagat på råvaror från trakten." },
      { title: "Runt knuten", body: "Tips på det bästa i närområdet." },
    ],
  },
  generic: {
    eyebrow: "Tjänster",
    title: "Det vi erbjuder",
    items: [
      { title: "Personlig service", body: "Vi lyssnar in vad du behöver." },
      { title: "Kvalitet", body: "Vi gör jobbet ordentligt, varje gång." },
      { title: "Enkel kontakt", body: "Hör av dig så återkommer vi snabbt." },
    ],
  },
};

const WHY_ITEMS: Record<string, SectionItem[]> = {
  warm: [
    { title: "Personligt bemötande", body: "Du möter samma människor varje gång." },
    { title: "Egna recept", body: "Vi gör det själva, från grunden." },
    { title: "Nära dig", body: "Ett litet företag med stort engagemang." },
  ],
  formal: [
    { title: "Erfarenhet", body: "Vana att hantera både små och stora uppdrag." },
    { title: "Tydliga villkor", body: "Du vet vad som gäller innan vi börjar." },
    { title: "Tillgänglighet", body: "Vi svarar snabbt och håller dig uppdaterad." },
  ],
};

const PROCESS_BY_INDUSTRY: Partial<Record<IndustryId, SectionItem[]>> = {
  construction: [
    { title: "Kontakt", body: "Du berättar vad du vill ha gjort." },
    { title: "Platsbesök & offert", body: "Vi tittar på jobbet och lämnar ett fast pris." },
    { title: "Utförande", body: "Vi håller tidplanen och städar efter oss." },
    { title: "Slutbesiktning", body: "Vi går igenom resultatet tillsammans." },
  ],
  legal: [
    { title: "Första samtalet", body: "Kostnadsfri genomgång av ärendet." },
    { title: "Förslag", body: "Du får ett tydligt upplägg och en kostnadsbild." },
    { title: "Genomförande", body: "Vi driver ärendet och håller dig informerad." },
  ],
  consulting: [
    { title: "Nuläge", body: "Vi förstår er verksamhet först." },
    { title: "Plan", body: "Konkreta steg och tydliga mål." },
    { title: "Genomförande", body: "Vi arbetar sida vid sida med er." },
  ],
  bakery: [
    { title: "Hör av dig", body: "Berätta vad du vill ha och till när." },
    { title: "Vi bakar", body: "Allt görs på plats i vårt kök." },
    { title: "Hämta eller få levererat", body: "Klart och färskt till din dag." },
  ],
};

/**
 * Industry-appropriate labels. Generic craft wording ("Genuint hantverk",
 * "Bilder från oss") is only used where it is actually true for the business.
 */
const HIGHLIGHT_BY_INDUSTRY: Partial<Record<IndustryId, { eyebrow: string; title: string; body: string }>> = {
  automotive: {
    eyebrow: "Standarden",
    title: "Bilar i toppskick",
    body: "Varje bil kontrolleras, rengörs och tankas innan den lämnas ut. Du kör iväg i en bil som känns ny.",
  },
  realestate: {
    eyebrow: "Vårt arbetssätt",
    title: "Trygg affär hela vägen",
    body: "Vi förbereder, marknadsför och följer upp — så att du vet var affären står i varje läge.",
  },
  legal: {
    eyebrow: "Vårt löfte",
    title: "Tydliga besked",
    body: "Du får raka svar, tydliga villkor och en kontaktperson som känner ditt ärende.",
  },
  consulting: {
    eyebrow: "Vårt arbetssätt",
    title: "Från plan till resultat",
    body: "Vi arbetar nära er verksamhet och mäter det som faktiskt gör skillnad.",
  },
  construction: {
    eyebrow: "På plats",
    title: "Utfört fackmässigt",
    body: "Rätt material, hållna tider och en arbetsplats som är städad när vi går hem.",
  },
  fitness: {
    eyebrow: "Träningen",
    title: "Framsteg som håller",
    body: "Upplägg som passar din vardag, med uppföljning så att du ser resultat över tid.",
  },
  beauty: {
    eyebrow: "Hos oss",
    title: "Omsorg i varje behandling",
    body: "Vi tar oss tid, lyssnar in vad du vill ha och arbetar med produkter vi står för.",
  },
  health: {
    eyebrow: "Vår omsorg",
    title: "Trygg vård i din takt",
    body: "Vi möter dig där du är och förklarar varje steg innan vi går vidare.",
  },
  hospitality: {
    eyebrow: "Vistelsen",
    title: "Lugnet du kom för",
    body: "Personligt bemötande, rena rum och små detaljer som gör skillnad.",
  },
};

const GALLERY_TITLE: Partial<Record<IndustryId, { eyebrow: string; title: string }>> = {
  automotive: { eyebrow: "Flottan", title: "Bilarna" },
  realestate: { eyebrow: "Objekt", title: "Ur vårt utbud" },
  construction: { eyebrow: "Referenser", title: "Utförda jobb" },
  photography: { eyebrow: "Portfolio", title: "Utvalda bilder" },
  beauty: { eyebrow: "Resultat", title: "Före och efter" },
  fitness: { eyebrow: "I gymmet", title: "Träningen hos oss" },
  hospitality: { eyebrow: "Miljöer", title: "Hos oss" },
  restaurant: { eyebrow: "Från köket", title: "Det vi serverar" },
  bakery: { eyebrow: "Från bageriet", title: "Dagens bak" },
  cafe: { eyebrow: "I caféet", title: "Fikat hos oss" },
};

const RENTAL_HIGHLIGHT = {
  eyebrow: "Uthyrningen",
  title: "Hyr enkelt, kör tryggt",
  body: "Försäkring, vägassistans och fria mil ingår i upplägget. Du bokar, vi gör bilen redo.",
};

const ABOUT_POINTS: Partial<Record<IndustryId, string[]>> = {
  automotive: ["Bilar i toppskick", "Privat & företag", "Snabb bokning"],
  realestate: ["Kostnadsfri värdering", "Lokal marknadskännedom", "Trygg affär"],
  legal: ["Tydliga villkor", "Erfaren rådgivning", "Snabb återkoppling"],
  consulting: ["Konkreta åtgärder", "Mätbara resultat", "Nära samarbete"],
  construction: ["Fast pris", "Hållna tider", "Städat efter oss"],
  cleaning: ["Fasta tider", "Egna produkter", "Nöjd-kund-garanti"],
  fitness: ["Personligt upplägg", "Uppföljning", "Träna när du vill"],
  beauty: ["Personlig konsultation", "Produkter vi står för", "Enkel bokning"],
  health: ["Trygg vård", "Korta väntetider", "Tydlig information"],
  bakery: ["Bakat på plats", "Egna recept", "Beställ till fest"],
  cafe: ["Nybryggt kaffe", "Hembakat", "Nära dig"],
  restaurant: ["Säsongens råvaror", "Boka bord enkelt", "Mat att dela"],
  hospitality: ["Personligt bemötande", "Hemlagad frukost", "Lugnt läge"],
};

const ABOUT_POINTS_DEFAULT = ["Personlig kontakt", "Tydliga besked", "Trygg leverans"];

/** Luxury car rental has nothing to do with a workshop, so it gets its own offer. */
const RENTAL_OFFER = {
  eyebrow: "Vår flotta",
  title: "Bilar att hyra",
  items: [
    { title: "Premium & sportbilar", body: "Noga utvalda bilar i toppskick, redo att köras." },
    { title: "Privat & företag", body: "Dygnshyra, helg eller längre upplägg med fast pris." },
    { title: "Leverans & upphämtning", body: "Vi möter upp där det passar dig bäst." },
  ],
};

export function buildSections(ctx: SectionContext): Section[] {
  const { industry, tone, local, description, images, docCount, company } = ctx;
  const rental = industry === "automotive" && Boolean(ctx.art?.subjects.includes("rental"));
  const heroImages = images.filter((i) => i.role === "hero");
  const featureImages = images.filter((i) => i.role === "feature");
  const galleryImages = images.filter((i) => i.role === "gallery");
  const indexOf = (img: SpecImage) => images.indexOf(img);

  const offer = rental ? RENTAL_OFFER : OFFER_LABELS[industry] || OFFER_LABELS.generic;
  const aboutBody = restSentences(description, 2) || firstSentences(description, 2) || `${company} är ett företag som sätter kunden först.`;
  const sections: Section[] = [];

  sections.push({
    id: "hero",
    type: "hero",
    images: heroImages.slice(0, 1).map(indexOf),
  });

  sections.push({
    id: "about",
    type: "about",
    eyebrow: local ? "Om oss — lokalt och nära" : "Om oss",
    title: tone.craft > 0.6 ? "Gjort för hand, med omsorg" : tone.formality > 0.75 ? "Erfarenhet du kan luta dig mot" : "Det här är vi",
    body: aboutBody,
    items: (ABOUT_POINTS[industry] || ABOUT_POINTS_DEFAULT).map((title) => ({ title })),
    images: featureImages.slice(0, 1).map(indexOf),
    layout: featureImages.length ? "split" : "list",
    tone: "base",
  });

  sections.push({
    id: "services",
    type: "services",
    eyebrow: offer.eyebrow,
    title: offer.title,
    items: offer.items,
    images: featureImages.slice(1, 4).map(indexOf),
    layout: "grid",
    tone: "alt",
  });

  {
    const craftHighlight =
      tone.craft > 0.55 && ["bakery", "cafe", "restaurant", "photography", "beauty"].includes(industry);
    const highlight = rental
      ? RENTAL_HIGHLIGHT
      : craftHighlight
        ? {
            eyebrow: "Hantverket",
            title: "Från råvara till färdigt",
            body: "Vi väljer råvarorna själva och gör det mesta för hand. Det tar lite längre tid — men det smakar och syns.",
          }
        : HIGHLIGHT_BY_INDUSTRY[industry] || {
            eyebrow: "Så jobbar vi",
            title: "Gjort ordentligt från början",
            body: "Vi tar oss tid att göra rätt från början, så att resultatet håller över tid.",
          };
    sections.push({
      id: "highlight",
      type: "highlight",
      eyebrow: highlight.eyebrow,
      title: highlight.title,
      body: highlight.body,
      images: featureImages.slice(1, 3).map(indexOf),
      layout: "split-reverse",
      tone: "base",
    });
  }

  if (local) {
    sections.push({
      id: "local",
      type: "local",
      eyebrow: "Lokalt",
      title: "Förankrade där vi verkar",
      body: "Vi handlar lokalt när vi kan och känner våra kunder vid namn. Det är så vi vill driva företag.",
      tone: "contrast",
    });
  }

  const processItems = PROCESS_BY_INDUSTRY[industry];
  if (processItems) {
    sections.push({
      id: "process",
      type: "process",
      eyebrow: "Så går det till",
      title: "Enkelt från första kontakt",
      items: processItems,
      layout: "steps",
      tone: "base",
    });
  }

  sections.push({
    id: "why",
    type: "why",
    eyebrow: "Varför oss",
    title: "Det du kan räkna med",
    items: tone.warmth > 0.65 ? WHY_ITEMS.warm : WHY_ITEMS.formal,
    layout: "grid",
    tone: processItems ? "alt" : "base",
  });

  {
    const gallery = rental
      ? { eyebrow: "Flottan", title: "Bilarna" }
      : GALLERY_TITLE[industry] || { eyebrow: "Galleri", title: "Från verksamheten" };
    sections.push({
      id: "gallery",
      type: "gallery",
      eyebrow: gallery.eyebrow,
      title: gallery.title,
      images: galleryImages.map(indexOf),
      layout: "masonry",
      tone: "base",
    });
  }

  // Customer instructions steer generation internally only — they are never
  // printed verbatim on the public preview.


  if (docCount > 0) {
    sections.push({ id: "documents", type: "documents", eyebrow: "Material", title: "Bifogade filer", tone: "base" });
  }

  sections.push({
    id: "contact",
    type: "contact",
    eyebrow: "Kontakt",
    title: tone.warmth > 0.65 ? "Hör gärna av dig" : "Kontakta oss",
    body: sentences(description).length ? "" : "",
    tone: "contrast",
  });

  return sections;
}
