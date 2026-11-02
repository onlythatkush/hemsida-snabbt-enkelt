import type { Img, Site } from "./types";

/** Curated Unsplash photo. Every image carries descriptive Swedish alt text (also used as fallback). */
const i = (id: string, alt: string, w = 1000): Img => ({ src: `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=75`, alt });
const H = 1800;

export const sites: Site[] = [
  // ───────── Hantverk (quote-led, inga påhittade prislistor) ─────────
  {
    id: "byggfirma", industry: "Byggfirma", category: "Hantverk", archetype: "quote", theme: "blueprint", brand: "Stenberg Bygg",
    hero: { variant: "architectural", eyebrow: "Byggentreprenad sedan 1998", title: "Vi bygger det som håller.", lead: "Nyproduktion, renovering och tillbyggnad för privatpersoner och företag i Mälardalen.", cta: "Begär offert", secondary: "Våra projekt", image: i("photo-1600585154340-be6161a56a0c", "Nybyggd modern villa med stora fönster", H) },
    services: { heading: "Tjänster", items: [
      { title: "Nyproduktion", text: "Villor och flerbostadshus, från grund till nyckelfärdigt.", image: i("photo-1541888946425-d81bb19240f5", "Byggarbetsplats med stomme och kran") },
      { title: "Renovering", text: "Kök, badrum och totalrenoveringar med tydlig tidplan.", image: i("photo-1503387762-592deb58ef4e", "Ritningar och verktyg på arbetsbord") },
      { title: "Tillbyggnad", text: "Attefall, uterum och påbyggnad – vi hjälper med bygglovet.", image: i("photo-1504307651254-35680f356dfd", "Byggarbetare med hjälm på byggplats") },
    ]},
    offer: { kind: "quote", heading: "Utvalda projekt", credentials: ["F-skatt", "Byggföretagen-medlem", "ID06", "Ansvarsförsäkring", "BKR-auktoriserad våtrum"], projects: [
      { title: "Villa Ekudden", meta: "Nyproduktion · 210 m²", image: i("photo-1600596542815-ffad4c1539a9", "Färdigställd villa med trädgård") },
      { title: "Kv. Tegelbruket", meta: "Flerbostadshus · 24 lgh", image: i("photo-1486406146926-c627a92ad1ab", "Flerbostadshus i modern arkitektur") },
      { title: "Sjöstugan", meta: "Tillbyggnad · 45 m²", image: i("photo-1600607687939-ce8a6c25118c", "Ljust vardagsrum i tillbyggnad") },
    ]},
    references: [{ quote: "Höll tidplan och budget till punkt och pricka.", author: "Familjen Lind, Täby" }, { quote: "Professionella från första möte till slutbesiktning.", author: "BRF Solgården" }],
    contact: { heading: "Begär en kostnadsfri offert", text: "Berätta om ditt projekt så återkommer vi inom två arbetsdagar.", phone: "08-555 12 34", address: "Exempelbacken 8, Uppsala" },
  },
  {
    id: "elektriker", industry: "Elektriker", category: "Hantverk", archetype: "quote", theme: "signal", brand: "Volt & Co El", accent: "oklch(0.15 0 0)",
    hero: { variant: "bold", eyebrow: "Auktoriserad elinstallatör · Göteborg", title: "Ström du kan lita på.", lead: "Elinstallation, laddboxar och felsökning för hem och företag. Vi kommer när vi lovat.", cta: "Begär offert", secondary: "Ring jouren", image: i("photo-1621905251189-08b45d6a269e", "Elektriker kopplar kablar i elcentral", H) },
    services: { heading: "Vad vi gör", items: [
      { title: "Elinstallation", text: "Nyinstallation och omdragning i villa, lägenhet och lokal.", image: i("photo-1621905252507-b35492cc74b4", "Elektriker arbetar med eluttag") },
      { title: "Laddbox", text: "Installation av laddbox – vi hjälper till med grönt avdrag.", image: i("photo-1593941707882-a5bba14938c7", "Elbil som laddas vid laddbox") },
      { title: "Felsökning", text: "Jordfel, säkringar som går och besiktning av elanläggning.", image: i("photo-1581092918056-0c4c3acd3789", "Tekniker felsöker elektronik") },
    ]},
    offer: { kind: "quote", heading: "Referensuppdrag", credentials: ["Elsäkerhetsverket-registrerad", "Installatörsföretagen", "Behörighet B", "Grönt avdrag", "Jour dygnet runt"], projects: [
      { title: "Villa Askim", meta: "Byte av elcentral", image: i("photo-1555963966-b7ae5404b6ed", "Ny elcentral med automatsäkringar") },
      { title: "Kontor Lindholmen", meta: "Belysning 900 m²", image: i("photo-1497366216548-37526070297c", "Kontorslokal med ny belysning") },
      { title: "BRF Majorna", meta: "12 laddplatser", image: i("photo-1593941707882-a5bba14938c7", "Elbil ansluten till laddstolpe") },
    ]},
    references: [{ quote: "Snabba, prydliga och tydliga med vad som skulle göras.", author: "Karin, Askim" }, { quote: "Vår självklara elpartner för alla fastigheter.", author: "Fastighetschef, BRF Majorna" }],
    contact: { heading: "Berätta om ditt eljobb", text: "Skicka gärna bilder – vi återkommer med offert inom 24 h.", phone: "031-12 34 56", address: "Exempelgatan 3, Göteborg" },
  },
  {
    id: "vvs", industry: "VVS", category: "Hantverk", archetype: "quote", theme: "nordic", brand: "Rörkraft VVS", accent: "oklch(0.5 0.12 240)",
    hero: { variant: "split", eyebrow: "VVS · Badrum · Värmepumpar", title: "Rör som fungerar. Badrum som håller.", lead: "Certifierade VVS-montörer för badrumsrenovering, stambyten och värmesystem i Västerås.", cta: "Begär offert", secondary: "Akut läcka?", image: i("photo-1584622650111-993a426fbf0a", "Nyrenoverat badrum med kakel och dusch", 1200) },
    services: { heading: "Tjänster", items: [
      { title: "Badrumsrenovering", text: "Helhetsåtagande med våtrumsintyg enligt branschregler.", image: i("photo-1552321554-5fefe8c9ef14", "Modernt badrum med handfat") },
      { title: "Service & läckor", text: "Blandare, toaletter och vattenläckor – snabbt på plats.", image: i("photo-1585704032915-c3400ca199e7", "VVS-montör reparerar rör under handfat") },
      { title: "Värme", text: "Värmepumpar, golvvärme och byte av varmvattenberedare.", image: i("photo-1607400201889-565b1ee75f8e", "Rörinstallation för värmesystem") },
    ]},
    offer: { kind: "quote", heading: "Senaste uppdragen", credentials: ["Säker Vatten-auktoriserad", "GVK-våtrum", "Kvalitetsansvarig", "ROT-avdrag hanteras"], projects: [
      { title: "Badrum Vallby", meta: "Totalrenovering 6 m²", image: i("photo-1620626011761-996317b8d101", "Ljust badrum med kakel efter renovering") },
      { title: "BRF Kopparlunden", meta: "Stambyte 48 lgh", image: i("photo-1504328345606-18bbc8c9d7d1", "Rörarbete i fastighet") },
      { title: "Villa Önsta", meta: "Bergvärme", image: i("photo-1600566753086-00f18fb6b3ea", "Villa med nytt värmesystem") },
    ]},
    references: [{ quote: "Badrummet blev exakt som vi drömt om.", author: "Linnéa & Ola, Vallby" }, { quote: "Smidigt stambyte med bra information till de boende.", author: "Styrelsen, BRF Kopparlunden" }],
    contact: { heading: "Få en offert på ditt projekt", text: "Vi gör kostnadsfria hembesök inom Västerås.", phone: "021-44 55 66", address: "Exempelvägen 21, Västerås" },
  },
  {
    id: "taklaggare", industry: "Takläggare", category: "Hantverk", archetype: "quote", theme: "noir", brand: "Nordtak", accent: "oklch(0.68 0.14 45)",
    hero: { variant: "cinematic", eyebrow: "Takläggning · Plåtslageri · Örebro", title: "Ett tak för generationer.", lead: "Takbyten, tegel, betongpannor och plåttak – utfört av certifierade takläggare med 15 års garanti.", cta: "Begär offert", secondary: "Se takprojekt", image: i("photo-1632759145351-1d592919f522", "Takläggare arbetar på ett tegeltak", H) },
    services: { heading: "Våra tjänster", items: [
      { title: "Takbyte", text: "Komplett omläggning med ny underlagsduk och läkt.", image: i("photo-1605276374104-dee2a0ed3cd6", "Nylagda takpannor") },
      { title: "Plåttak", text: "Falsat plåttak, takavvattning och beslag.", image: i("photo-1635424710928-0544e8512eae", "Svart falsat plåttak") },
      { title: "Takinspektion", text: "Besiktning med drönare och skriftligt utlåtande.", image: i("photo-1600585152220-90363fe7e115", "Villa med nytt tak") },
    ]},
    offer: { kind: "quote", heading: "Takprojekt", credentials: ["Plåt & Vent-ansluten", "15 års garanti", "Ställningsbyggnad i egen regi", "ROT-avdrag"], projects: [
      { title: "Villa Adolfsberg", meta: "Tegeltak 180 m²", image: i("photo-1598228723793-52759bba239c", "Villa med rött tegeltak") },
      { title: "Lantgård Glanshammar", meta: "Plåttak 420 m²", image: i("photo-1513584684374-8bab748fbf90", "Gård med plåttak på landet") },
      { title: "Radhus Ladugårdsängen", meta: "Betongpannor", image: i("photo-1570129477492-45c003edd2be", "Radhus med nya takpannor") },
    ]},
    references: [{ quote: "Taket klart på fem dagar trots regn. Imponerande.", author: "Per, Adolfsberg" }, { quote: "Grundlig inspektion och ärlig rådgivning.", author: "Anna, Ladugårdsängen" }],
    contact: { heading: "Dags för nytt tak?", text: "Vi gör kostnadsfri takbesiktning och lämnar fast offert.", phone: "019-22 33 44", address: "Exempelgatan 9, Örebro" },
  },
  {
    id: "maleri", industry: "Måleri", category: "Hantverk", archetype: "quote", theme: "warm", brand: "Kulör Måleri", accent: "oklch(0.55 0.1 150)",
    hero: { variant: "editorial", eyebrow: "Måleri & tapetsering · Malmö", title: "Färg som förändrar rummet.", lead: "Invändig och utvändig målning med noggrant förarbete. Vi täcker, spacklar och lämnar rent efter oss.", cta: "Begär offert", secondary: "Se före & efter", image: i("photo-1562259949-e8e7689d7828", "Målare rollar vägg i ljus kulör", 1400) },
    services: { heading: "Tjänster", items: [
      { title: "Invändig målning", text: "Väggar, tak och snickerier med miljömärkta färger.", image: i("photo-1589939705384-5185137a7f0f", "Målare med pensel vid fönsterkarm") },
      { title: "Fasadmålning", text: "Tvätt, skrapning och målning av trä- och putsfasad.", image: i("photo-1600047509807-ba8f99d2cdde", "Nymålad trähusfasad") },
      { title: "Tapetsering", text: "Mönsterpassning och fototapet med perfekt finish.", image: i("photo-1615529182904-14819c35db37", "Rum med ny mönstrad tapet") },
    ]},
    offer: { kind: "quote", heading: "Före & efter", credentials: ["Målericentralen-ansluten", "Gesällbrev", "Miljömärkta färger", "ROT-avdrag"], projects: [
      { title: "Sekelskifteslägenhet", meta: "Möllevången · 4 rok", image: i("photo-1600210492486-724fe5c67fb0", "Ljust nymålat vardagsrum") },
      { title: "Trävilla Limhamn", meta: "Fasad, falu rödfärg", image: i("photo-1518780664697-55e3ad937233", "Trävilla med nymålad fasad") },
      { title: "Café Västra Hamnen", meta: "Lokal 120 m²", image: i("photo-1554118811-1e0d58224f24", "Café med nymålade väggar") },
    ]},
    references: [{ quote: "Fantastiskt noggranna – inte en droppe på parketten.", author: "Sofia, Möllevången" }, { quote: "Fasaden ser ny ut. Rekommenderas varmt.", author: "Bengt, Limhamn" }],
    contact: { heading: "Få ett fast pris", text: "Vi kommer hem till dig, tittar på ytorna och lämnar offert samma vecka.", phone: "040-11 22 33", address: "Exempelgatan 14, Malmö" },
  },

  // ───────── Hem & service ─────────
  {
    id: "stadfirma", industry: "Städfirma", category: "Hem & service", archetype: "package", theme: "nordic", brand: "Klara Städ",
    hero: { variant: "split", eyebrow: "Hemstäd · Flyttstäd · Kontor", title: "Kom hem till ett rent hem.", lead: "Återkommande hemstädning med samma städare varje gång. RUT-avdraget dras direkt på fakturan.", cta: "Boka städning", secondary: "Se priser", image: i("photo-1581578731548-c64695cc6952", "Städare torkar köksbänk med trasa", 1200) },
    services: { heading: "Våra städtjänster", items: [
      { title: "Hemstädning", text: "Varje, varannan eller var fjärde vecka.", image: i("photo-1527515637462-cff94eecc1ac", "Städare dammsuger vardagsrum") },
      { title: "Flyttstädning", text: "Med städgaranti – godkänt av mäklare och hyresvärd.", image: i("photo-1563453392212-326f5e854473", "Städutrustning i tom lägenhet") },
      { title: "Kontorsstäd", text: "Städning av kontor och lokaler efter arbetstid.", image: i("photo-1497366811353-6870744d04b2", "Rent och ljust kontor") },
    ]},
    offer: { kind: "package", heading: "Abonnemang", unit: "/ tillfälle efter RUT", tiers: [
      { name: "Var 4:e vecka", price: "590 kr", features: ["3 timmar", "Samma städare", "Eget städmaterial"] },
      { name: "Varannan vecka", price: "495 kr", featured: true, features: ["3 timmar", "Samma städare", "Fönsterputs 2 ggr/år"] },
      { name: "Varje vecka", price: "445 kr", features: ["3 timmar", "Prioriterad bokning", "Strykning ingår"] },
    ]},
    references: [{ quote: "Bästa investeringen för vår småbarnsfamilj.", author: "Maria, Bromma" }, { quote: "Pålitliga och alltid lika noggranna.", author: "Erik, Solna" }],
    contact: { heading: "Boka din första städning", text: "Fyll i formuläret så ringer vi upp och bokar ett kostnadsfritt hembesök.", phone: "08-222 33 44", address: "Exempelvägen 2, Stockholm" },
  },
  {
    id: "flyttfirma", industry: "Flyttfirma", category: "Hem & service", archetype: "package", theme: "signal", brand: "FLYTTBOLAGET", accent: "oklch(0.15 0 0)",
    hero: { variant: "bold", eyebrow: "Privatflytt · Kontorsflytt · Magasinering", title: "Vi bär. Du flyttar.", lead: "Fast pris, försäkrade flyttar och packhjälp i hela Stockholmsregionen. RUT-avdrag på arbetet.", cta: "Begär offert", secondary: "Räkna på flytten", image: i("photo-1600518464441-9154a4dea21b", "Flyttkartonger staplade i ny lägenhet", 1400) },
    services: { heading: "Tjänster", items: [
      { title: "Privatflytt", text: "Lägenhet eller villa – med lastbil och erfaren personal.", image: i("photo-1603796846097-bee99e4a601f", "Flyttare bär kartonger till flyttbil") },
      { title: "Packhjälp", text: "Vi packar, skyddar och märker allt bohag.", image: i("photo-1558997519-83ea9252edf8", "Packade flyttlådor med tejp") },
      { title: "Magasinering", text: "Säker förvaring i larmade lokaler, per månad.", image: i("photo-1586528116311-ad8dd3c8310d", "Lagerlokal med hyllor") },
    ]},
    offer: { kind: "package", heading: "Flyttpaket", unit: "efter RUT", tiers: [
      { name: "1:a–2:a", price: "fr. 3 900 kr", features: ["2 flyttare + bil", "Upp till 4 timmar", "Försäkring ingår"] },
      { name: "3:a–4:a", price: "fr. 6 900 kr", featured: true, features: ["3 flyttare + bil", "Möbelmontering", "Lån av flyttlådor"] },
      { name: "Villa", price: "fr. 11 900 kr", features: ["4 flyttare + 2 bilar", "Packhjälp", "Flyttstäd som tillval"] },
    ]},
    references: [{ quote: "Klart före lunch och inget gick sönder.", author: "Jonas, Södermalm" }, { quote: "Tydligt fast pris – inga överraskningar.", author: "Lena, Huddinge" }],
    contact: { heading: "Få ett fast pris på din flytt", text: "Ange från- och tilladress så återkommer vi med offert samma dag.", phone: "08-333 44 55", address: "Exempelgatan 40, Stockholm" },
  },

  // ───────── Fordon ─────────
  {
    id: "bilrekond", industry: "Bilrekond", category: "Fordon", archetype: "package", theme: "noir", brand: "Noir Rekond",
    hero: { variant: "cinematic", eyebrow: "Bilrekond · Polering · Keramiskt skydd", title: "Din bil, i nyskick.", lead: "Handtvätt, invändig djuprengöring och maskinpolering utförd med precision i vår studio i Stockholm.", cta: "Boka rekond", secondary: "Se paket", image: i("photo-1607860108855-64acf2078ed9", "Bil täckt av skum under handtvätt", H) },
    services: { heading: "Våra tjänster", items: [
      { title: "Invändig rengöring", text: "Dammsugning, ångtvätt av klädsel och behandling av alla ytor.", image: i("photo-1600964373031-f0b65565f356", "Invändig rengöring av bilsäten och instrumentbräda") },
      { title: "Utvändig tvätt", text: "Skonsam handtvätt med förtvätt, skum och tvåhinksmetod.", image: i("photo-1601362840469-51e4d8d58785", "Handtvätt av bil med skum och svamp") },
      { title: "Polering", text: "Maskinpolering som tar bort swirls och återställer djup glans.", image: i("photo-1619405399517-d7fce0f13302", "Maskinpolering av billack") },
    ]},
    offer: { kind: "package", heading: "Rekondpaket", tiers: [
      { name: "Bas", price: "1 295 kr", features: ["Utvändig handtvätt", "Invändig dammsugning", "Fönsterputs"] },
      { name: "Signatur", price: "3 495 kr", featured: true, features: ["Komplett invändig rekond", "Polering ett steg", "Vaxskydd 3 mån"] },
      { name: "Concours", price: "8 995 kr", features: ["Flerstegspolering", "Keramiskt skydd", "Läderbehandling"] },
    ]},
    references: [{ quote: "Bilen ser bättre ut än när jag köpte den.", author: "Johan, Volvo XC90" }, { quote: "Otroligt noggranna, varje detalj var perfekt.", author: "Sara, Tesla Model 3" }],
    contact: { heading: "Boka din rekond", text: "Lämna bilen på morgonen – hämta den skinande på eftermiddagen.", phone: "08-123 45 67", address: "Exempelgatan 12, Stockholm" },
  },
  {
    id: "bilverkstad", industry: "Bilverkstad", category: "Fordon", archetype: "appointment", theme: "blueprint", brand: "Motorverket", accent: "oklch(0.55 0.18 30)",
    hero: { variant: "architectural", eyebrow: "Service · Reparation · Däck", title: "Service utan krångel.", lead: "Märkesoberoende verkstad med originaldelar och bibehållen nybilsgaranti. Lånebil finns.", cta: "Boka tid", secondary: "Våra tjänster", image: i("photo-1487754180451-c456f719a1fc", "Mekaniker arbetar under motorhuv", H) },
    services: { heading: "Verkstadstjänster", items: [
      { title: "Service", text: "Enligt tillverkarens serviceprogram, stämpel i serviceboken.", image: i("photo-1619642751034-765dfdf7c58e", "Mekaniker utför service på bil") },
      { title: "Reparation", text: "Bromsar, avgassystem, koppling och felsökning.", image: i("photo-1625047509248-ec889cbff17f", "Bilverkstad med lyftad bil") },
      { title: "Däckhotell", text: "Däckbyte, förvaring och hjulinställning.", image: i("photo-1580273916550-e323be2ae537", "Däckbyte på bilverkstad") },
    ]},
    offer: { kind: "appointment", heading: "Vanliga jobb", rows: [
      { name: "Däckskifte", price: "fr. 495 kr", note: "Inkl. tryckkontroll" },
      { name: "Liten service", price: "fr. 1 995 kr", note: "Olja, filter, kontroll" },
      { name: "Stor service", price: "fr. 3 995 kr", note: "Enligt serviceprogram" },
      { name: "Bromsbyte fram", price: "fr. 2 795 kr", note: "Skivor och belägg" },
      { name: "AC-service", price: "fr. 1 195 kr" },
    ]},
    references: [{ quote: "Ärliga besked och fick bilen samma dag.", author: "Mikael, Linköping" }, { quote: "Äntligen en verkstad man litar på.", author: "Annika, Mjärdevi" }],
    contact: { heading: "Boka verkstadstid", text: "Vardagar 07–17. Lämna bilen kvällen innan i nyckelboxen.", phone: "013-10 20 30", address: "Exempelvägen 7, Linköping" },
  },
  {
    id: "biluthyrning", industry: "Biluthyrning", category: "Fordon", archetype: "product", theme: "nordic", brand: "Hyrbil Norr", accent: "oklch(0.55 0.15 255)",
    hero: { variant: "split", eyebrow: "Hyrbil per dygn · Luleå", title: "Hyr bil – från ett dygn.", lead: "Personbilar, elbilar och minibussar. Fri körsträcka 300 km/dygn och hämtning på Luleå Airport.", cta: "Boka bil", secondary: "Se bilarna", image: i("photo-1449965408869-eaa3f722e40d", "Personbil som kör längs landsväg", 1200) },
    services: { heading: "Så fungerar det", items: [
      { title: "Välj bil & datum", text: "Boka online – betala per dygn, ingen deposition för medlemmar.", image: i("photo-1554744512-d6c603f27c54", "Bilnycklar överlämnas vid uthyrning") },
      { title: "Hämta", text: "På kontoret eller flygplatsen, vardagar 07–19.", image: i("photo-1436491865332-7a61a109cc05", "Flygplats där hyrbilen hämtas") },
      { title: "Kör & lämna", text: "Vinterdäck och försäkring ingår alltid.", image: i("photo-1483721310020-03333e577078", "Bil på snöig väg i norra Sverige") },
    ]},
    offer: { kind: "product", heading: "Bilar att hyra", items: [
      { name: "Småbil", desc: "VW Polo eller liknande · 5 säten", price: "fr. 449 kr/dygn", image: i("photo-1541899481282-d53bffe3c35d", "Liten röd halvkombi", 600) },
      { name: "Kombi", desc: "Volvo V60 eller liknande", price: "fr. 649 kr/dygn", image: i("photo-1552519507-da3b142c6e3d", "Mellanstor personbil framifrån", 600) },
      { name: "Elbil", desc: "Tesla Model 3 · 450 km räckvidd", price: "fr. 799 kr/dygn", image: i("photo-1560958089-b8a1929cea89", "Vit Tesla elbil", 600) },
      { name: "Minibuss", desc: "9 säten · automat", price: "fr. 1 095 kr/dygn", image: i("photo-1570125909232-eb263c188f7e", "Vit minibuss för grupper", 600) },
    ]},
    references: [{ quote: "Bilen stod klar vid flyget. Superenkelt.", author: "Thomas, affärsresenär" }, { quote: "Bra vinterbilar och schyssta priser.", author: "Familjen Berg" }],
    contact: { heading: "Boka hyrbil", text: "Ange datum och biltyp så bekräftar vi bokningen direkt.", phone: "0920-12 34 56", address: "Exempelvägen 5, Luleå" },
  },

  // ───────── Skönhet & hälsa ─────────
  {
    id: "frisor", industry: "Frisör", category: "Skönhet & hälsa", archetype: "appointment", theme: "warm", brand: "Studio Lugg", accent: "oklch(0.45 0.08 20)",
    hero: { variant: "editorial", eyebrow: "Frisörsalong · Vasastan", title: "Hår med personlighet.", lead: "Klippning, färg och styling av prisbelönta frisörer. Boka online dygnet runt.", cta: "Boka tid", secondary: "Se prislista", image: i("photo-1560066984-138dadb4c035", "Ljus frisörsalong med stolar och speglar", 1400) },
    services: { heading: "Behandlingar", items: [
      { title: "Klippning", text: "Konsultation, tvätt, klippning och styling.", image: i("photo-1562322140-8baeececf3df", "Frisör klipper kunds hår") },
      { title: "Färg & slingor", text: "Balayage, toning och helfärg med skonsamma produkter.", image: i("photo-1522337360788-8b13dee7a37e", "Frisör färgar hår med pensel") },
      { title: "Styling", text: "Uppsättning för bröllop och fest.", image: i("photo-1595476108010-b4d1f102b1b1", "Stylat långt hår i salong") },
    ]},
    offer: { kind: "appointment", heading: "Prislista", rows: [
      { name: "Klippning kort hår", price: "650 kr", note: "45 min" },
      { name: "Klippning långt hår", price: "795 kr", note: "60 min" },
      { name: "Balayage inkl. klippning", price: "2 450 kr", note: "180 min" },
      { name: "Helfärg", price: "1 450 kr", note: "90 min" },
      { name: "Barnklippning", price: "395 kr", note: "upp till 12 år" },
    ]},
    references: [{ quote: "Bästa balayagen jag någonsin haft!", author: "Elin, Vasastan" }, { quote: "Lyssnar verkligen på vad man vill ha.", author: "David, Odenplan" }],
    contact: { heading: "Boka din tid", text: "Tisdag–lördag. Avbokning senast 24 h innan.", phone: "08-444 55 66", address: "Exempelgatan 18, Stockholm" },
  },
  {
    id: "skonhetssalong", industry: "Skönhetssalong", category: "Skönhet & hälsa", archetype: "appointment", theme: "noir", brand: "Maison Lumière", accent: "oklch(0.78 0.06 20)",
    hero: { variant: "cinematic", eyebrow: "Hudvård · Naglar · Fransar", title: "Ta en stund för dig själv.", lead: "Ansiktsbehandlingar, manikyr och fransförlängning i en lugn salong mitt i Uppsala.", cta: "Boka tid", secondary: "Behandlingar", image: i("photo-1570172619644-dfd03ed5d881", "Kvinna får ansiktsbehandling i salong", H) },
    services: { heading: "Behandlingar", items: [
      { title: "Ansiktsbehandling", text: "Djuprengöring, peeling och mask anpassad efter din hud.", image: i("photo-1487412947147-5cebf100ffc2", "Hudterapeut applicerar ansiktsmask") },
      { title: "Naglar", text: "Manikyr, gellack och nagelförlängning.", image: i("photo-1519014816548-bf5fe059798b", "Manikyr med nagellack") },
      { title: "Fransar & bryn", text: "Fransförlängning, lashlift och browlift.", image: i("photo-1583001931096-959e9a1a6223", "Närbild på fransbehandling") },
    ]},
    offer: { kind: "appointment", heading: "Prislista", rows: [
      { name: "Klassisk ansiktsbehandling", price: "895 kr", note: "60 min" },
      { name: "Gellack händer", price: "495 kr", note: "45 min" },
      { name: "Fransförlängning nytt set", price: "1 095 kr", note: "120 min" },
      { name: "Lashlift inkl. färg", price: "695 kr", note: "60 min" },
      { name: "Browlift", price: "595 kr", note: "45 min" },
    ]},
    references: [{ quote: "Lugnt, rent och otroligt skickliga.", author: "Hanna, Uppsala" }, { quote: "Min huds bästa vän sedan två år.", author: "Fatima, Luthagen" }],
    contact: { heading: "Boka behandling", text: "Presentkort finns att köpa i salongen och online.", phone: "018-12 13 14", address: "Exempelgatan 6, Uppsala" },
  },
  {
    id: "gym-pt", industry: "Gym / PT", category: "Skönhet & hälsa", archetype: "package", theme: "signal", brand: "PULS GYM", accent: "oklch(0.15 0 0)",
    hero: { variant: "bold", eyebrow: "Gym · Personlig träning · Grupppass", title: "Starkare varje vecka.", lead: "Öppet 05–23, certifierade PT:s och 40 grupppass i veckan. Ingen bindningstid.", cta: "Bli medlem", secondary: "Boka PT", image: i("photo-1534438327276-14e5300c3a48", "Gym med skivstänger och vikter", 1400) },
    services: { heading: "Träna som du vill", items: [
      { title: "Gym", text: "Fria vikter, maskiner och funktionell yta.", image: i("photo-1517836357463-d25dfeac3438", "Person lyfter skivstång i gym") },
      { title: "Personlig träning", text: "Individuellt program och uppföljning.", image: i("photo-1571019614242-c5c5dee9f50b", "Personlig tränare coachar klient") },
      { title: "Grupppass", text: "Spinning, yoga, HIIT och styrka.", image: i("photo-1518611012118-696072aa579a", "Grupppass med träning på mattor") },
    ]},
    offer: { kind: "package", heading: "Medlemskap", unit: "/ mån", tiers: [
      { name: "Gym", price: "349 kr", features: ["Fri tillgång 05–23", "Introduktion", "Ingen bindningstid"] },
      { name: "Gym + pass", price: "449 kr", featured: true, features: ["Alla grupppass", "Bastu", "1 gäst/mån"] },
      { name: "PT-paket", price: "2 495 kr", features: ["4 PT-pass/mån", "Kostupplägg", "Allt i Gym + pass"] },
    ]},
    references: [{ quote: "Min PT har förändrat min träning totalt.", author: "Ali, medlem sedan 2023" }, { quote: "Bästa passen i stan, fantastisk stämning.", author: "Moa, medlem" }],
    contact: { heading: "Testa en vecka gratis", text: "Fyll i dina uppgifter så får du ett provträningskort.", phone: "08-666 77 88", address: "Exempelgatan 30, Stockholm" },
  },

  // ───────── Mat & dryck ─────────
  {
    id: "restaurang", industry: "Restaurang", category: "Mat & dryck", archetype: "product", theme: "warm", brand: "Terrakotta",
    hero: { variant: "editorial", eyebrow: "Kök & vinbar · Södermalm", title: "Säsongens smaker, långsamt lagade.", lead: "Ett varmt bord, rustik matlagning och naturvin. Välkommen till vårt kvarterskök.", cta: "Boka bord", secondary: "Se menyn", image: i("photo-1517248135467-4c7edcad34c4", "Restaurangmatsal med dukade bord", 1400) },
    services: { heading: "Upplevelsen", items: [
      { title: "À la carte", text: "Råvarudriven meny som skiftar med säsongen.", image: i("photo-1414235077428-338989a2e8c0", "Elegant tallrik på restaurang") },
      { title: "Provsmakning", text: "Sex rätter med valfri vinparning.", image: i("photo-1504674900247-0877df9cc836", "Upplagd rätt med kött och grönsaker") },
      { title: "Privata middagar", text: "Chambre séparée för upp till 16 gäster.", image: i("photo-1551218808-94e220e084d2", "Långbord dukat för sällskap") },
    ]},
    offer: { kind: "product", heading: "Meny", items: [
      { name: "Burrata", desc: "Grillad persika, basilika, hasselnöt", price: "165 kr" },
      { name: "Röding", desc: "Brynt smör, kapris, potatispuré", price: "285 kr" },
      { name: "Lammracks", desc: "Rostad vitlök, rosmarin, rödvinssky", price: "325 kr" },
      { name: "Hemlagad pasta", desc: "Tagliatelle, svamp, parmesan", price: "225 kr" },
      { name: "Provsmakning", desc: "Sex rätter", price: "795 kr" },
      { name: "Tiramisu", desc: "Espresso, mascarpone, kakao", price: "125 kr" },
    ]},
    references: [{ quote: "Stockholms mysigaste middag. Lammet var magiskt.", author: "Emma L." }, { quote: "Fantastisk service och spännande viner.", author: "Ahmed K." }],
    contact: { heading: "Boka bord", text: "Tisdag–lördag 17–23. Större sällskap bokas via telefon.", phone: "08-765 43 21", address: "Exempelvägen 4, Stockholm" },
  },
  {
    id: "cafe-bageri", industry: "Café / Bageri", category: "Mat & dryck", archetype: "product", theme: "nordic", brand: "Surdegsbageriet", accent: "oklch(0.55 0.1 60)",
    hero: { variant: "split", eyebrow: "Hantverksbageri & café · Lund", title: "Nybakat varje morgon från 07.", lead: "Surdegsbröd, kardemummabullar och kaffe från lokalt rosteri.", cta: "Se menyn", secondary: "Beställ tårta", image: i("photo-1509440159596-0249088772ff", "Nybakade surdegsbröd på hylla", 1200) },
    services: { heading: "Hos oss", items: [
      { title: "Bröd", text: "Långjäst surdeg bakad på svenskt mjöl.", image: i("photo-1549931319-a545dcf3bc73", "Surdegsbröd skuret på bräda") },
      { title: "Fika", text: "Kanelbullar, kardemumma och säsongsbakverk.", image: i("photo-1509365465985-25d11c17e812", "Kanelbullar på bakplåt") },
      { title: "Kaffe", text: "Espresso och bryggkaffe från lokalt rosteri.", image: i("photo-1495474472287-4d71bcdd2085", "Kopp kaffe på träbord") },
    ]},
    offer: { kind: "product", heading: "Dagens disk", items: [
      { name: "Bakverkskorg", desc: "Bullar, kardemumma & vetebröd", price: "fr. 38 kr", image: i("photo-1608198093002-ad4e005484ec", "Korg med nybakade bakverk och bröd", 600) },
      { name: "Surdegslimpa", desc: "Råg & dinkel, 800 g", price: "69 kr", image: i("photo-1586444248902-2f64eddc13df", "Rund surdegslimpa med mjöl", 600) },
      { name: "Croissant", desc: "Smörig, 72 h", price: "35 kr", image: i("photo-1555507036-ab1f4038808a", "Croissanter på bricka", 600) },
      { name: "Cappuccino", desc: "Havre- eller mjölkdryck", price: "45 kr", image: i("photo-1572442388796-11668a67e53d", "Cappuccino med latte art", 600) },
    ]},
    references: [{ quote: "Lunds bästa kardemummabulle, utan tvekan.", author: "Oskar, Lund" }, { quote: "Mysig stämning och fantastiskt bröd.", author: "Ida, student" }],
    contact: { heading: "Välkommen in", text: "Mån–fre 07–18, lör–sön 08–16. Tårtbeställning senast två dagar innan.", phone: "046-12 34 56", address: "Exempelgatan 1, Lund" },
  },

  // ───────── Företag ─────────
  {
    id: "akeri-transport", industry: "Åkeri / Transport", category: "Företag", archetype: "quote", theme: "blueprint", brand: "Lindqvist Åkeri", accent: "oklch(0.6 0.15 60)",
    hero: { variant: "architectural", eyebrow: "B2B-transporter sedan 1987", title: "Gods i rörelse. I tid.", lead: "Distribution, fjärrtransport och kranbil för industri och bygg i hela Mellansverige.", cta: "Begär offert", secondary: "Vår fordonsflotta", image: i("photo-1601584115197-04ecc0da31d7", "Lastbil kör på motorväg", H) },
    services: { heading: "Transporttjänster", items: [
      { title: "Fjärrtransport", text: "Hela och delade laster, dagligen Stockholm–Göteborg.", image: i("photo-1519003722824-194d4455a60c", "Lastbil med släp på landsväg") },
      { title: "Kranbil", text: "Lyft av byggmaterial, containrar och maskiner.", image: i("photo-1590496793929-36417d3117de", "Kranbil lyfter last på byggplats") },
      { title: "Lager & cross-dock", text: "Omlastning och mellanlagring i egen terminal.", image: i("photo-1586528116311-ad8dd3c8310d", "Lagerterminal med pallar") },
    ]},
    offer: { kind: "quote", heading: "Därför väljer kunder oss", credentials: ["Sveriges Åkeriföretag", "ISO 14001", "Fair Transport", "HVO100-drift", "ADR-behörighet"], projects: [
      { title: "Byggleveranser", meta: "Ramavtal · 3 entreprenörer", image: i("photo-1541888946425-d81bb19240f5", "Byggarbetsplats med levererat material") },
      { title: "Industridistribution", meta: "Daglig linjetrafik", image: i("photo-1494412574643-ff11b0a5c1c3", "Containrar och godshantering") },
      { title: "Fordonsflotta", meta: "42 fordon · Euro 6", image: i("photo-1592838064575-70ed626d3a0e", "Lastbilar uppställda på depå") },
    ]},
    references: [{ quote: "Leveransprecision vi inte hittat någon annanstans.", author: "Inköpschef, verkstadsindustri" }, { quote: "Flexibla när projektet ändrades i sista stund.", author: "Platschef, byggentreprenör" }],
    contact: { heading: "Begär transportoffert", text: "Ange sträcka, godstyp och frekvens så återkommer vi inom en arbetsdag.", phone: "016-12 34 00", address: "Exempelvägen 50, Eskilstuna" },
  },
  {
    id: "konsultforetag", industry: "Konsultföretag", category: "Företag", archetype: "quote", theme: "warm", brand: "Ahlgren Advisory", accent: "oklch(0.35 0.06 250)",
    hero: { variant: "editorial", eyebrow: "Management & förändringsledning", title: "Strategi som blir verklighet.", lead: "Vi hjälper ledningsgrupper att prioritera rätt, leda förändring och mäta effekt.", cta: "Boka ett samtal", secondary: "Våra case", image: i("photo-1552664730-d307ca884978", "Konsulter i möte runt whiteboard", 1400) },
    services: { heading: "Erbjudande", items: [
      { title: "Strategi", text: "Affärsplan, marknadsanalys och prioritering.", image: i("photo-1600880292203-757bb62b4baf", "Ledningsgrupp i strategimöte") },
      { title: "Förändringsledning", text: "Organisation, processer och kulturarbete.", image: i("photo-1556761175-5973dc0f32e7", "Workshop med post-it-lappar") },
      { title: "Interimsledning", text: "Erfarna chefer för kritiska perioder.", image: i("photo-1573497019940-1c28c88b4f3e", "Erfaren chef i samtal") },
    ]},
    offer: { kind: "quote", heading: "Utvalda case", credentials: ["20+ seniora konsulter", "Ramavtal offentlig sektor", "Certifierade ledarskapscoacher"], projects: [
      { title: "Regional energibolag", meta: "Ny affärsstrategi", image: i("photo-1497366216548-37526070297c", "Modern kontorsmiljö") },
      { title: "Kommunal förvaltning", meta: "Omorganisation 400 medarb.", image: i("photo-1521737604893-d14cc237f11d", "Team som samarbetar vid bord") },
      { title: "Tillverkande industri", meta: "Interim-VD 9 mån", image: i("photo-1581091226825-a6a2a5aee158", "Industrimiljö med ingenjör") },
    ]},
    references: [{ quote: "Gav oss klarhet och fart på rekordtid.", author: "VD, energibolag" }, { quote: "Konkreta, lyhörda och resultatinriktade.", author: "Förvaltningschef" }],
    contact: { heading: "Låt oss prata om er utmaning", text: "Boka ett kostnadsfritt 30-minuterssamtal med en senior partner.", phone: "08-10 20 30", address: "Exempelgatan 1, Stockholm" },
  },
  {
    id: "it-telekom", industry: "IT / Telekom", category: "Företag", archetype: "package", theme: "noir", brand: "Nordnät IT", accent: "oklch(0.75 0.14 200)",
    hero: { variant: "cinematic", eyebrow: "IT-drift · Nätverk · Företagstelefoni", title: "IT som bara fungerar.", lead: "Support, säkerhet och molntjänster för små och medelstora företag – fast pris per användare.", cta: "Begär offert", secondary: "Se tjänstepaket", image: i("photo-1558494949-ef010cbdcc31", "Serverhall med nätverksutrustning", H) },
    services: { heading: "Tjänster", items: [
      { title: "IT-support", text: "Helpdesk på svenska, fjärr- och platssupport.", image: i("photo-1517694712202-14dd9538aa97", "Laptop med kod på skärmen") },
      { title: "Nätverk & WiFi", text: "Design, installation och övervakning.", image: i("photo-1544197150-b99a580bb7a8", "Nätverkskablar i switch") },
      { title: "Företagstelefoni", text: "Mobil växel och Teams-integration.", image: i("photo-1556761175-b413da4baf72", "Medarbetare i telefonmöte på kontor") },
    ]},
    offer: { kind: "package", heading: "Tjänstepaket", unit: "/ anv. & mån exkl. moms", tiers: [
      { name: "Bas", price: "395 kr", features: ["Helpdesk vardagar", "Microsoft 365", "Antivirus"] },
      { name: "Business", price: "695 kr", featured: true, features: ["Helpdesk 07–19", "Backup & MFA", "Nätverksövervakning"] },
      { name: "Komplett", price: "995 kr", features: ["Dygnet runt", "Säkerhetscenter", "Mobil växel"] },
    ]},
    references: [{ quote: "Vi har inte haft ett driftstopp sedan bytet.", author: "Ekonomichef, redovisningsbyrå" }, { quote: "Snabb support som förstår vår verksamhet.", author: "VD, arkitektkontor" }],
    contact: { heading: "Få en IT-genomlysning", text: "Vi kartlägger er miljö kostnadsfritt och föreslår rätt paket.", phone: "08-50 60 70", address: "Exempelgatan 22, Stockholm" },
  },

  // ───────── Fastighet & handel ─────────
  {
    id: "fastighetsbolag", industry: "Fastighetsbolag", category: "Fastighet & handel", archetype: "property", theme: "blueprint", brand: "Ekbacken Fastigheter", accent: "oklch(0.42 0.07 160)",
    hero: { variant: "architectural", eyebrow: "Hyresrätter & lokaler · Norrköping", title: "Hem att trivas i.", lead: "Vi förvaltar 1 200 lägenheter och 40 kommersiella lokaler med fokus på trygghet och närvaro.", cta: "Se lediga objekt", secondary: "Felanmälan", image: i("photo-1545324418-cc1a3fa10c00", "Modernt flerbostadshus med balkonger", H) },
    services: { heading: "För hyresgäster", items: [
      { title: "Lägenheter", text: "Ställ dig i kö – poäng från första dagen.", image: i("photo-1560448204-e02f11c3d0e2", "Ljust vardagsrum i hyreslägenhet") },
      { title: "Lokaler", text: "Kontor, butik och lager i centrala lägen.", image: i("photo-1497366811353-6870744d04b2", "Ljus kontorslokal") },
      { title: "Förvaltning", text: "Egen fastighetsskötare i varje område.", image: i("photo-1600607687644-c7171b42498f", "Trapphus och entré i flerbostadshus") },
    ]},
    offer: { kind: "property", heading: "Lediga objekt", listings: [
      { title: "Kv. Linden 4", meta: "2 rok · 58 m² · balkong", price: "8 450 kr/mån", status: "Ledig 1/12", image: i("photo-1502672260266-1c1ef2d93688", "Ljus lägenhet med stora fönster") },
      { title: "Kv. Hagen 12", meta: "3 rok · 76 m² · nyrenoverad", price: "10 900 kr/mån", status: "Visning", image: i("photo-1522708323590-d24dbb6b0267", "Modernt kök i lägenhet") },
      { title: "Drottninggatan 8", meta: "Kontor · 140 m²", price: "1 650 kr/m²/år", status: "Ledig nu", image: i("photo-1497366754035-f200968a6e72", "Kontorslokal med skrivbord") },
    ]},
    references: [{ quote: "Snabb felanmälan och trevlig personal.", author: "Hyresgäst, Kv. Linden" }, { quote: "Perfekt lokal för vår växande byrå.", author: "Kommersiell hyresgäst" }],
    contact: { heading: "Intresseanmälan", text: "Berätta vad du söker så kontaktar vi dig när rätt objekt blir ledigt.", phone: "011-12 34 56", address: "Exempelgatan 10, Norrköping" },
  },
  {
    id: "e-handel", industry: "E-handel", category: "Fastighet & handel", archetype: "product", theme: "signal", brand: "FORM&LERA", accent: "oklch(0.15 0 0)",
    hero: { variant: "bold", eyebrow: "Handgjord keramik · Fri frakt över 499 kr", title: "Lera, eld, vardag.", lead: "Skandinavisk keramik drejad för hand i Gotland. Skickas inom 48 timmar.", cta: "Handla", secondary: "Nyheter", image: i("photo-1610701596007-11502861dcfa", "Handgjorda keramikskålar på hylla", 1400) },
    services: { heading: "Därför handlar du här", items: [
      { title: "Handgjort", text: "Varje föremål är unikt och signerat.", image: i("photo-1565193566173-7a0ee3dbe261", "Keramiker drejar lera") },
      { title: "Snabb leverans", text: "Postnord eller DHL, 1–3 dagar.", image: i("photo-1607082349566-187342175e2f", "Paket redo för leverans") },
      { title: "30 dagars öppet köp", text: "Fri retur inom Sverige.", image: i("photo-1578749556568-bc2c40e68b61", "Keramikvaser i naturligt ljus") },
    ]},
    offer: { kind: "product", heading: "Bästsäljare", items: [
      { name: "Skål Sand", desc: "Ø 16 cm", price: "295 kr", image: i("photo-1610701596061-2ecf227e85b2", "Beige keramikskål", 600) },
      { name: "Mugg Skiffer", desc: "30 cl", price: "245 kr", image: i("photo-1514228742587-6b1558fcca3d", "Grå keramikmugg", 600) },
      { name: "Vas Hav", desc: "H 24 cm", price: "595 kr", image: i("photo-1578500494198-246f612d3b3d", "Blå keramikvas", 600) },
      { name: "Tallrik Kalk", desc: "Ø 26 cm", price: "325 kr", image: i("photo-1603199506016-b9a594b593c0", "Vit keramiktallrik", 600) },
    ]},
    references: [{ quote: "Ännu vackrare i verkligheten. Snabb leverans.", author: "Kund, Trustpilot" }, { quote: "Mina favoritmuggar – köpt fyra till.", author: "Kund, Göteborg" }],
    contact: { heading: "Frågor om din order?", text: "Kundtjänst svarar vardagar 09–16.", phone: "0498-12 34 56", address: "Exempelvägen 3, Visby" },
  },
];

export const siteById = (id: string) => sites.find((s) => s.id === id);