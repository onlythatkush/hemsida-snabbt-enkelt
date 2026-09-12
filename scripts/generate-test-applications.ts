/**
 * QA test battery for the design engine.
 * Generates 20 clearly marked [TEST] demo applications with design specs,
 * and prints SQL that can be applied to the database.
 * Run: bun scripts/generate-test-applications.ts > /tmp/test-apps.sql
 */
import { composeDesignSpec } from "../src/lib/design/compose";
import { TEST_CASES } from "../src/lib/design/test-cases";

export { TEST_CASES };

const UNUSED_CASES: never[] = [
  {
    reference: "TEST-001",
    company: "[TEST] Nordbygg Entreprenad AB",
    description:
      "Vi är en byggfirma i Södertälje med 14 anställda som utför totalentreprenad, tillbyggnader, badrumsrenovering och markarbeten åt både privatpersoner och bostadsrättsföreningar. Robust och industriell känsla, vi vill visa maskiner och färdiga projekt.",
    website_type: "Företagssida med projektgalleri",
    colors: "Mörk grafit, svart, varningsgul accent",
    extra_requests: "Tuff, robust och industriell stil. Mörk bakgrund. Tydlig offertknapp högst upp.",
    address: "Verkstadsgatan 12, 151 38 Södertälje",
    email: "test.nordbygg@exempel.se",
    phone: "070-000 00 01",
    social_links: "https://facebook.com/exempel-nordbygg",
    file_names: [],
  },
  {
    reference: "TEST-002",
    company: "[TEST] Salong Linnea",
    description:
      "Frisörsalong i centrala Uppsala med fyra stolar. Vi erbjuder klippning, färg, slingor och bruduppsättningar. Vi vill ha en elegant och ljus sida med onlinebokning och prislista.",
    website_type: "Bokningssida",
    colors: "Ljus beige, off-white, mjuk guld",
    extra_requests: "Elegant, ljust, stilrent och minimalistiskt. Luftigt med mycket vitt.",
    address: "Svartbäcksgatan 21, 753 32 Uppsala",
    email: "test.salonglinnea@exempel.se",
    phone: "070-000 00 02",
    social_links: "https://instagram.com/exempel_salonglinnea",
    file_names: [],
  },
  {
    reference: "TEST-003",
    company: "[TEST] Pizzeria La Sosta",
    description:
      "Familjeägd pizzeria och restaurang i Norrköping. Vedugnsbakad pizza, pasta och lunchbuffé. Vi vill visa meny, öppettider och möjlighet att ringa och beställa avhämtning.",
    website_type: "Restaurangsida med meny",
    colors: "Tomatröd, varm terrakotta, grädde",
    extra_requests: "Varm, mysig och familjär känsla. Mycket bilder på maten.",
    address: "Drottninggatan 44, 602 24 Norrköping",
    email: "test.lasosta@exempel.se",
    phone: "070-000 00 03",
    social_links: "https://facebook.com/exempel-lasosta",
    file_names: [],
  },
  {
    reference: "TEST-004",
    company: "[TEST] Motorpunkten Bilverkstad",
    description:
      "Bilverkstad i Jönköping som utför service, felsökning, däckbyte, AC-service och besiktningshjälp på alla märken. Teknisk och rejäl känsla, vi vill att kunder enkelt ska boka tid.",
    website_type: "Tjänstesida med tidsbokning",
    colors: "Svart, stålgrå, elektrisk blå",
    extra_requests: "Tuff, teknisk och rå stil. Kraftfull typografi och mörk bakgrund.",
    address: "Verkstadsvägen 3, 553 02 Jönköping",
    email: "test.motorpunkten@exempel.se",
    phone: "070-000 00 04",
    social_links: "",
    file_names: [],
  },
  {
    reference: "TEST-005",
    company: "[TEST] Klarvit Städ & Lokalvård",
    description:
      "Städfirma i Malmö med hemstäd, flyttstäd, fönsterputs och lokalvård för kontor. RUT-avdrag. Vi vill ha en ren och fräsch sida där man snabbt kan begära offert.",
    website_type: "Tjänstesida med offertformulär",
    colors: "Frisk turkos, vitt, ljusgrå",
    extra_requests: "Ren, fräsch, ljus och luftig design. Enkelt och stilrent.",
    address: "Bergsgatan 9, 214 22 Malmö",
    email: "test.klarvit@exempel.se",
    phone: "070-000 00 05",
    social_links: "",
    file_names: [],
  },
  {
    reference: "TEST-006",
    company: "[TEST] Lindqvist Redovisning AB",
    description:
      "Redovisningsbyrå i Örebro med bokföring, löner, bokslut och deklaration för småföretag. Vi har arbetat med lokala företagare sedan 1998 och vill förmedla trygghet och erfarenhet.",
    website_type: "Företagssida",
    colors: "Mörkblå, vit, diskret grön",
    extra_requests: "Professionell, seriös och pålitlig. Förtroendeingivande och lugn.",
    address: "Köpmangatan 14, 702 23 Örebro",
    email: "test.lindqvistredovisning@exempel.se",
    phone: "070-000 00 06",
    social_links: "https://linkedin.com/company/exempel-lindqvist",
    file_names: [],
  },
  {
    reference: "TEST-007",
    company: "[TEST] Puls PT-Studio",
    description:
      "Träningsstudio och personlig tränare i Västerås. Vi kör PT, smågruppsträning och crossfit-inspirerade pass. Energisk och peppig stil som får folk att vilja boka provträning.",
    website_type: "Bokningssida",
    colors: "Neongrön, svart, vitt",
    extra_requests: "Energisk, peppig och kraftfull. Stora rubriker och rörelse.",
    address: "Kopparbergsvägen 18, 722 13 Västerås",
    email: "test.pulspt@exempel.se",
    phone: "070-000 00 07",
    social_links: "https://instagram.com/exempel_pulspt",
    file_names: [],
  },
  {
    reference: "TEST-008",
    company: "[TEST] Strömvik El & Installation",
    description:
      "Elektriker i Sundsvall som gör elinstallationer, laddboxar, solceller och felsökning åt villaägare och företag. Vi vill kännas moderna och pålitliga med tydliga tjänstekort.",
    website_type: "Tjänstesida",
    colors: "Klarblå, mörkgrå, vit",
    extra_requests: "Modern, stilren och pålitlig. Trygg men inte tråkig.",
    address: "Storgatan 40, 852 30 Sundsvall",
    email: "test.stromvikel@exempel.se",
    phone: "070-000 00 08",
    social_links: "",
    file_names: [],
  },
  {
    reference: "TEST-009",
    company: "[TEST] Bageri Kvarnhjulet",
    description:
      "Litet bageri och café i Falun med surdegsbröd, kanelbullar och hembakade tårtor på närodlade råvaror. Genuint hantverk, vedugn och gammaldags recept. Vi vill visa fika och bakverk.",
    website_type: "Café- och bagerisida",
    colors: "Varm ockra, mjölkvit, ljusbrun",
    extra_requests: "Varm, hemtrevlig, jordnära och hantverksmässig. Mycket bilder på bakverk.",
    address: "Åsgatan 27, 791 71 Falun",
    email: "test.kvarnhjulet@exempel.se",
    phone: "070-000 00 09",
    social_links: "https://instagram.com/exempel_kvarnhjulet",
    file_names: [],
  },
  {
    reference: "TEST-010",
    company: "[TEST] Tandläkarna vid Torget",
    description:
      "Tandläkarklinik i Linköping med allmäntandvård, tandhygienist, implantat och tandblekning. Vi vill kännas rena och kliniska men samtidigt varma och trygga för nervösa patienter.",
    website_type: "Klinik- och bokningssida",
    colors: "Mjuk mintgrön, vit, ljus sand",
    extra_requests: "Lugn, harmonisk och trygg. Ljust och rent men välkomnande.",
    address: "Storgatan 8, 582 23 Linköping",
    email: "test.tandlakarnatorget@exempel.se",
    phone: "070-000 00 10",
    social_links: "",
    file_names: [],
  },
  {
    reference: "TEST-011",
    company: "[TEST] Vektor IT-konsult",
    description:
      "IT-konsultbolag i Stockholm som gör systemutveckling, molnmigrering och teknisk projektledning åt scale-ups. Vi vill ha en modern och premium sida med tydliga case och kontaktvägar.",
    website_type: "Konsultsida",
    colors: "Djup indigo, svart, silver",
    extra_requests: "Modern, minimalistisk och premium. Exklusiv känsla, gärna mörkt läge.",
    address: "Sveavägen 120, 113 50 Stockholm",
    email: "test.vektorit@exempel.se",
    phone: "070-000 00 11",
    social_links: "https://linkedin.com/company/exempel-vektor",
    file_names: [],
  },
  {
    reference: "TEST-012",
    company: "[TEST] Hudateljén Sofia",
    description:
      "Hudvårdssalong i Göteborg med ansiktsbehandlingar, kemisk peeling, fillers och fransar. Vi vill ha en mjuk, exklusiv och lyxig känsla med tydlig prislista och onlinebokning.",
    website_type: "Bokningssida",
    colors: "Champagne, puderrosa, varmgrå",
    extra_requests: "Exklusiv, elegant och lyxig men mjuk och avkopplande.",
    address: "Linnégatan 32, 413 04 Göteborg",
    email: "test.hudateljen@exempel.se",
    phone: "070-000 00 12",
    social_links: "https://instagram.com/exempel_hudateljen",
    file_names: [],
  },
  {
    reference: "TEST-013",
    company: "[TEST] Lundgren Fastighetsmäklare",
    description:
      "Mäklarbyrå i Lund som förmedlar villor och bostadsrätter. Vi har lokal kännedom om bygden och vill ha en exklusiv sida där objekt och fri värdering står i fokus.",
    website_type: "Mäklarsida med objekt",
    colors: "Mörkgrön, mässing, benvit",
    extra_requests: "Exklusiv, elegant och etablerad. Lokal förankring ska synas.",
    address: "Bantorget 5, 222 29 Lund",
    email: "test.lundgrenmaklare@exempel.se",
    phone: "070-000 00 13",
    social_links: "",
    file_names: [],
  },
  {
    reference: "TEST-014",
    company: "[TEST] Ateljé Nord Foto",
    description:
      "Fotograf i Umeå som gör bröllopsfotografering, porträtt och företagsbilder samt enklare videoproduktion. Sidan ska vara bilddriven och avskalad så att bilderna får all uppmärksamhet.",
    website_type: "Portfoliosida",
    colors: "Svartvitt, varm sand som accent",
    extra_requests: "Minimalistisk och avskalad. Stora bilder, väldigt lite text.",
    address: "Kungsgatan 55, 903 26 Umeå",
    email: "test.ateljenordfoto@exempel.se",
    phone: "070-000 00 14",
    social_links: "https://instagram.com/exempel_ateljenord",
    file_names: [],
  },
  {
    reference: "TEST-015",
    company: "[TEST] Konfetti Eventbyrå",
    description:
      "Eventbyrå i Helsingborg som planerar bröllop, företagsfester, konferenser och releasefester. Vi bokar DJ, artister och lokal. Vi vill ha en kreativ och färgstark sida.",
    website_type: "Eventsida",
    colors: "Korall, lila, solgul",
    extra_requests: "Lekfull, färgglad, energisk och rolig. Får gärna sticka ut.",
    address: "Järnvägsgatan 7, 252 24 Helsingborg",
    email: "test.konfettievent@exempel.se",
    phone: "070-000 00 15",
    social_links: "https://instagram.com/exempel_konfetti",
    file_names: [],
  },
  {
    reference: "TEST-016",
    company: "[TEST] Skogsro Webshop",
    description:
      "E-handel och webbshop som säljer handgjorda ljus, textilier och inredning online. Vi vill ha en produktdriven sida med tydliga produktkort, frakt- och returinformation.",
    website_type: "E-handel",
    colors: "Mossgrön, linbeige, svart text",
    extra_requests: "Stilren och naturlig. Produkterna i fokus, enkelt att handla.",
    address: "Hantverkargatan 3, 671 31 Arvika",
    email: "test.skogsro@exempel.se",
    phone: "070-000 00 16",
    social_links: "https://instagram.com/exempel_skogsro",
    file_names: [],
  },
  {
    reference: "TEST-017",
    company: "[TEST] Advokatbyrån Hägg & Partners",
    description:
      "Advokatbyrå i Stockholm med familjerätt, avtal, arbetsrätt och tvistelösning. Vi vill ha en sober och förtroendeingivande sida som förklarar juridiken enkelt för privatpersoner.",
    website_type: "Byråsida",
    colors: "Mörk marinblå, guldbeige, vit",
    extra_requests: "Seriös, sober och förtroendeingivande. Etablerad och erfaren känsla.",
    address: "Birger Jarlsgatan 18, 114 34 Stockholm",
    email: "test.haggpartners@exempel.se",
    phone: "070-000 00 17",
    social_links: "https://linkedin.com/company/exempel-hagg",
    file_names: [],
  },
  {
    reference: "TEST-018",
    company: "[TEST] Blomsterhandeln Vildros",
    description:
      "Blomsterhandel och florist i Kalmar med buketter, bröllopsbinderi, begravningsblommor och krukväxter. Organisk och lekfull känsla med mycket färg och närbilder på blommor.",
    website_type: "Butikssida",
    colors: "Rosa, lavendel, bladgrön",
    extra_requests: "Lekfull, färgglad och naturlig. Mjuka former och glad ton.",
    address: "Storgatan 26, 392 32 Kalmar",
    email: "test.vildros@exempel.se",
    phone: "070-000 00 18",
    social_links: "https://facebook.com/exempel-vildros",
    file_names: [],
  },
  {
    reference: "TEST-019",
    company: "[TEST] Rörjour Bohus VVS",
    description:
      "VVS och rörmokare i Uddevalla med jour dygnet runt, stambyten, värmepumpar och badrumsinstallation. Lokal firma i trakten. Praktisk sida där telefonnumret alltid syns.",
    website_type: "Tjänstesida",
    colors: "Blå, vit, orange accent",
    extra_requests: "Enkel, praktisk och trygg. Lokal firma man kan lita på.",
    address: "Kungsgatan 18, 451 31 Uddevalla",
    email: "test.bohusvvs@exempel.se",
    phone: "070-000 00 19",
    social_links: "",
    file_names: [],
  },
  {
    reference: "TEST-020",
    company: "[TEST] Sjövillan Hotell & B&B",
    description:
      "Litet hotell och bed and breakfast vid sjön utanför Växjö med åtta rum, frukost på närodlade råvaror och bastu vid vattnet. Atmosfärisk sida som säljer känslan av en helg bort.",
    website_type: "Hotell- och bokningssida",
    colors: "Djupblå, varm trä, krämvit",
    extra_requests: "Atmosfärisk, lugn och avkopplande. Stora stämningsfulla bilder.",
    address: "Sjövägen 4, 352 45 Växjö",
    email: "test.sjovillan@exempel.se",
    phone: "070-000 00 20",
    social_links: "https://instagram.com/exempel_sjovillan",
    file_names: [],
  },
];

function esc(value: string | null | undefined) {
  if (value === null || value === undefined || value === "") return "NULL";
  return "'" + String(value).replaceAll("'", "''") + "'";
}

function token(reference: string) {
  // Deterministic 64-char token so re-running the script keeps preview links stable.
  let out = "";
  let h = 2166136261;
  for (const chunk of [reference, reference + "#2", reference + "#3", reference + "#4"]) {
    h = 2166136261;
    for (let i = 0; i < chunk.length; i++) {
      h ^= chunk.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    out += (h >>> 0).toString(16).padStart(8, "0").repeat(2);
  }
  return out;
}

const origin = process.env.PREVIEW_ORIGIN || "https://dinwebbpartner.com";
const rows: string[] = [];
const summary: Array<Record<string, string>> = [];

for (const testCase of TEST_CASES) {
  const spec = composeDesignSpec(testCase);
  const tok = token(testCase.reference);
  const previewUrl = `${origin}/kund-preview/${encodeURIComponent(testCase.reference)}?token=${tok}`;
  summary.push({
    ref: testCase.reference,
    company: testCase.company,
    family: spec.family,
    industry: spec.industry,
    mode: spec.palette.mode,
    primary: spec.palette.primary,
    sections: String(spec.sections.length),
  });
  rows.push(`(
  ${esc(testCase.reference)}, ${esc(testCase.company)}, ${esc(testCase.email)}, ${esc(testCase.phone)},
  ${esc(testCase.company)}, ${esc(testCase.address)}, ${esc(testCase.description)}, ${esc(testCase.social_links)},
  ${esc(testCase.website_type)}, ${esc(testCase.colors)}, ${esc(testCase.extra_requests)}, false, '{}'::text[],
  'archived', ${esc(previewUrl)}, ${esc(tok)},
  ${process.env.SKIP_SPEC ? "NULL" : esc(JSON.stringify(spec)) + "::jsonb"}, ${esc(spec.family)}, false
)`);
}

const sql = `INSERT INTO public.project_applications
(reference, name, email, phone, company, address, description, social_links,
 website_type, colors, extra_requests, wants_support, file_names,
 status, preview_url, preview_token, design_spec, design_family, design_locked)
VALUES
${rows.join(",\n")}
ON CONFLICT DO NOTHING;`;

console.log(sql);
console.error(JSON.stringify(summary, null, 2));
