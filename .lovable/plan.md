# Intern designmotor för kundunika previews

Målet: när admin trycker "Skapa hemsida" ska systemet läsa kundens ansökan och bygga en komplett, branschanpassad one-page-preview med kundens egna bilder — deterministiskt, utan extern AI i produktion.

Idag genererar "Skapa hemsida" bara en token och visar samma generiska mörka sidmall för alla kunder. Planen nedan ersätter det med en regelmotor som väljer designfamilj, tonalitet, sektioner och bildplacering per kund.

---

## 1) Data- och designmodell

Ny kolumn på ansökningarna: `design_spec` (JSONB) — det enda som previewen renderar från. Den skapas vid "Skapa hemsida" och kan redigeras/regenereras senare utan att röra kundens ansökan.

```text
design_spec = {
  version, generatedAt, seed,
  family: "warm-craft" | "clean-nordic" | ...,
  tone: { warmth, formality, playfulness, density },   // 0-1
  palette: { bg, surface, ink, muted, primary, accent, onPrimary, mode: light|dark },
  type:    { headingFont, bodyFont, scale, tracking, weight },
  shape:   { radius, borderStyle, shadow, imageTreatment },
  copy:    { heroTitle, heroSub, ctaPrimary, ctaSecondary, sectionIntros{} },
  sections: [ { id, type, title, body, imageRefs[], layout } ],
  images:   [ { path, role, focus, ratio, quality } ]
}
```

Extra kolumner: `design_family` (för filtrering i admin) och `design_locked` (hindrar överskrivning när admin justerat manuellt).

Tre lager i koden:
- **Analysator** – ansökan in, `intent`-objekt ut (bransch, tonord, färger, bildinventarie).
- **Kompositör** – `intent` in, `design_spec` ut (familj, palett, typografi, sektioner).
- **Renderare** – `design_spec` in, React-sida ut. Renderaren innehåller ingen affärslogik.

---

## 2) Designfamiljer (7 st)

Varje familj = en uppsättning tokens (palett, fonter, radie, skuggor, bildbehandling, sektionsrytm) + tillåtna sektionslayouter.

| Familj | Känsla | Typiskt för |
|---|---|---|
| `warm-craft` | Varm off-white, terrakotta/honung, mjuka rundningar, serif-rubriker, filmiga bilder | Bageri, café, hantverk, gårdsbutik (t.ex. Isolasweets) |
| `clean-nordic` | Ljus grå/vit, mycket luft, grotesk, tunna linjer, nästan inga skuggor | Konsult, redovisning, arkitekt |
| `trust-professional` | Djupblå + vit, strukturerad, tydliga kort, konservativ typografi | Juridik, ekonomi, vård, försäkring |
| `bold-modern` | Hög kontrast, stor display-typografi, färgblock, kantiga former | Bygg, industri, tech, gym |
| `soft-wellness` | Dova pasteller, generösa rundningar, låg kontrast, lugn rytm | Salong, spa, yoga, terapi |
| `fresh-retail` | Ljus bakgrund, produktrutnät, tydliga priskort, färgstark accent | Webshop, butik, blommor |
| `night-premium` | Mörk grafit, guld/kall accent, glow, tight tracking | Restaurang kvällsprofil, event, exklusiva tjänster |

Varje familj får två varianter (ljus/mörk eller lugn/expressiv) så samma familj inte ger identiska sidor.

---

## 3) Heuristik för familj + tonalitet

Poängsättning, inte if-satser:

1. **Bransch** från `website_type` + nyckelordsmatchning i `description` (svensk ordlista: bageri, konditori, hembakat, jurist, salong, snickeri, webshop …). Ger baspoäng till 2–3 familjer.
2. **Tonord** i `description`/`extra_requests` justerar poäng och tonvektorn: jordnära/familjär/genuin/hemtrevlig → warmth↑, `warm-craft`/`soft-wellness`; premium/exklusiv → formality↑, `night-premium`/`trust-professional`; modern/minimalistisk → `clean-nordic`; lekfull/färgglad → playfulness↑, `fresh-retail`.
3. **Geografi/lokalt** ("lokala råvaror", ortsnamn) → lokalt-sektion + varmare palett.
4. **Färgönskemål** (`colors`, hex eller ord som "beige", "guld") vinner alltid över familjens defaultpalett: kundens färg blir `primary`, resten härleds via kontrast/harmoni med garanterad WCAG AA mot text.
5. **Bildmaterial** – många varma/matiga foton drar mot bildtunga familjer; inga bilder alls drar mot typografidrivna familjer.
6. Vinnande familj = högst poäng; oavgjort bryts av `seed` från referensnumret så resultatet är stabilt och reproducerbart.

Tonvektorn styr sedan mikrobeslut: rundning, radavstånd, sektionshöjd, CTA-språk ("Beställ nu" vs "Hör av dig så tar vi en fika").

Isolasweets-exempel: hembakat + lokala råvaror + hemtrevligt + familjärt → `warm-craft`, ljus variant, serif-rubrik, radius 20px, mjuka skuggor, varm CTA — inte mörk SaaS.

---

## 4) Sektionslogik per bransch

En gemensam sektionskatalog; branschprofilen väljer vilka som ingår och i vilken ordning. Sektioner utan innehåll faller bort automatiskt.

- **Bas (alla):** hero, om oss, tjänster/utbud, varför oss, kontakt + öppettider, footer.
- **Mat/bageri/café:** utbud med bild, "vårt hantverk", lokala råvaror, galleri, beställning/kontakt.
- **Juridik/konsult:** tjänsteområden, process i steg, om/erfarenhet, referenser, boka möte.
- **Salong/wellness:** behandlingar med pris, galleri, teamet, boka tid.
- **Bygg/hantverk:** tjänster, referensprojekt före/efter, arbetsområde, offertformulär.
- **Webshop/butik:** produkter i rutnät, kategorier, leverans/villkor, kontakt.
- **Restaurang:** meny, atmosfärsgalleri, öppettider, hitta hit, boka bord.

Sektionstexterna genereras ur kundens egen beskrivning (meningsdelning + mallfraser per bransch/ton), aldrig lorem ipsum. Saknas underlag skrivs neutral men trovärdig text som admin lätt kan ersätta.

---

## 5) Bildhantering

- Läs de uppladdade filerna, hämta dimensioner och en genomsnittsfärg per bild.
- **Roller:** `hero` (bredast/högst upplösning), `feature` (2–3 näst bästa), `gallery` (resten), `texture` (små/lågupplösta används som bakgrundsdetalj, inte hero).
- Rangordning på upplösning, bildformat (liggande → hero, stående → mobilkort) och färgmatchning mot paletten.
- Hero-bild får alltid en läsbarhetsöverlagring härledd ur bildens ljushet, så rubriken syns.
- Inga bilder → familjen faller tillbaka på typografi-hero med mjuk gradient ur paletten, plus ikonbaserade sektionskort. Aldrig tomma bildhål.
- Bilder visas via signerade URL:er precis som idag, med fasta bildförhållanden så inget hoppar på mobil.

---

## 6) Implementation i nuvarande app

- `src/lib/design/` — ny, ren och testbar mapp utan React:
  - `keywords.ts` (svensk ordlista bransch + tonord)
  - `analyze.ts` (ansökan → intent)
  - `families.ts` (de 7 familjernas tokens)
  - `palette.ts` (färgtolkning, harmoni, kontrastsäkring)
  - `sections.ts` (branschprofiler + sektionskatalog)
  - `copy.ts` (svenska textmallar per ton)
  - `compose.ts` (intent → design_spec)
- Migration: `design_spec jsonb`, `design_family text`, `design_locked boolean` på `project_applications`.
- `POST /api/admin/applications` med `action: "create-preview"` kör kompositören och sparar `design_spec` tillsammans med token — samma knapp, samma statusflöde (Ny → Granskas → Skapa hemsida → Preview).
- Ny admin-action `action: "regenerate-design"` (valfri familj-override) så admin kan bläddra mellan förslag utan att skapa ny länk.
- `GET /api/public/project-preview/$reference` returnerar `design_spec` + signerade bild-URL:er.
- `src/routes/kund-preview.$reference.tsx` skrivs om till en tunn renderare: sätter CSS-variabler från paletten på en wrapper och mappar `sections[]` till sektionskomponenter i `src/components/preview/sections/`. Mobil först, inga hårdkodade färger i sektionerna.
- Enhetstester (vitest) på analysator och kompositör med ett antal realistiska ansökningar, inklusive Isolasweets, så vi kan verifiera att rätt familj väljs.
- Ingen extern AI-anrop. `design_spec` är gränssnittet — en AI kan senare producera samma JSON och renderaren behöver inte ändras.

---

## 7) Ordning — störst kvalitetslyft först

1. **`design_spec` + renderare med CSS-variabler och sektionskomponenter.** Utan detta spelar smartheten ingen roll.
2. **Palett- och typografimotorn** (kundens färger + ton → tokens). Störst visuell skillnad per rad kod.
3. **Bildrollstilldelning.** Kundens egna bilder som hero/galleri gör previewen omedelbart trovärdig.
4. **Branschsektioner.** Rätt sektioner gör sidan komplett i stället för generisk.
5. **De 7 designfamiljerna** i full bredd.
6. **Textgenerering per ton.**
7. **Admin: förhandsvisa/byt familj + lås design.**
8. Senare: AI-lager som föreslår `design_spec`, med regelmotorn som fallback.

Ingen kod ändras förrän planen är godkänd.
