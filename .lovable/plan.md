# Design Engine v2

Lyfter kundernas förhandsvisningar till en genomgående hög nivå — utan att röra beställningsflödet, adminpanelen, databasen, mail eller referenskoder.

## Vad kunden märker

- Varje genererad sida känns egenbyggd för just den branschen: bilhandlare får mörk, filmisk lyx; bageri behåller den varma Isola Sweets-nivån; hantverkare får robust och tydligt; skönhet/hälsa får lugnt och luftigt.
- Två kunder i samma bransch får inte identiska sidor — rubrikstil, sektionsordning, bildkomposition och detaljer varierar.
- Kundens egna bilder och logotyp används först och placeras medvetet (hero, utvalda block, galleri) i stället för att bara fyllas på.
- Mobilen är utgångspunkten: inga överlappande texter, ingen sidledsscroll, inga jätterubriker som spräcker skärmen, alltid läsbar kontrast.
- Förhandsvisningssidan visar bara kundens egen sajt — inget internt gränssnitt syns runt om eller bakom.

## Så byggs det

### 1. Starkare designgrund (`src/lib/design/`)

- `tokens.ts` (ny): en genomräknad tokenmodell — typografisk skala (clamp-baserad, mobilsäker), spacing-rytm, radier, skuggnivåer, kontrastregler, CTA-hierarki (primär/sekundär/länk) och bildbehandling (ratio, beskärning, overlay-styrka, filter).
- `families.ts`: utökas till premiumfamiljer med egen karaktär i stället för gemensam mall — `cinematic-auto` (lyx/bil), `warm-craft` (bageri/café/mat), `industrial-trade` (bygg/VVS/el), `calm-wellness` (skönhet/hälsa), `editorial-b2b` (konsult/B2B), `estate-modern` (fastighet), `night-premium` (restaurang/hospitality), `kinetic-fitness` (träning). Varje familj får egna sektionsrecept, bildbehandling och rubrikbeteende.
- `variants.ts` (ny): deterministisk variation från kundens referens/seed — väljer hero-typ, sektionsordning, kortstil och accentanvändning inom familjens ramar, så sidor inte blir kloner men fortfarande reproducerbara.
- `compose.ts`: kopplar ihop brief → bransch/ton → familj → tokens → variant → sektioner. Samma in­data ger samma resultat som idag (befintliga sparade `design_spec` fortsätter fungera).

### 2. Kundens material först

- `assets.ts` (ny): klassar uppladdat material (logotyp, hero-kandidat, produkt/miljö, dokument), bedömer hur många bilder som finns och bygger en plan för var de ska användas. Logotyp renderas i header/footer i stället för att hamna i galleriet. Stockbilder fyller bara det som saknas.

### 3. Renderare (`src/components/preview/`)

- Delas upp i `PreviewRenderer.tsx` + `sections/`-block så nya sektionstyper kan läggas till utan att skriva om filen.
- Strikta responsregler i ett gemensamt lager: clamp på all rubrikstorlek, min-width-skydd mot överflöd, ordbrytning för långa företagsnamn, bildratio i stället för fasta höjder, säkra overlays för textkontrast.

### 4. Kvalitetsport (`src/lib/design/quality.ts`, ny)

- Kör strukturella kontroller på en färdig spec: finns hero med bild, finns CTA, finns kontaktuppgifter, kontrast på text mot bakgrund/overlay, rubriklängd kontra mobilbredd, sektionsantal och bildtäckning.
- Returnerar poäng + lista med anmärkningar. Sparas i `design_spec.qa` och visas i admin som grön/gul/röd status. Blockerar inget i det befintliga produktionsflödet.

### 5. Isolerad kundpreview

- `/kund-preview/$reference` renderas helt fristående utan projektets globala bakgrund, header eller adminrelaterad UI. Endast en diskret liten Din Webbpartner-rad ovanför sidan (som idag), inget internt.

### 6. Förberett för Hub

- `src/lib/design/index.ts` exporterar ett tydligt API: `composeDesignSpec`, `evaluateQuality`, `FAMILIES`, `listFamilies()`. Familjer och referensdesigner läggs till som data — ingen ändring i genereringslogiken krävs.

## Vad som inte rörs

Beställningsformulär, `api/public/*`, admin-API:er, mailutskick, referenskoder, databasstruktur (utom att `design_spec` får ett `qa`-fält), domäner och hemligheter. Ingen publicering görs.

## Kontroll innan klart

Typkontroll och bygge, regenerering av testgalleriets 20 fall lokalt, samt mobilgranskning (375 px) av flera previews — bland annat Isola Sweets och Premium Cars — med kontroll av överflöd, kontrast och rubrikbrytning.
