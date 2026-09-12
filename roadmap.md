
## Designmotor (godkänd plan, fas 1-4)
- [x] Migration: design_spec/design_family/design_locked på project_applications
- [x] src/lib/design: analyze, palette, families, sections, copy, compose
- [x] Admin "Skapa hemsida" genererar design_spec
- [x] Preview-API returnerar design_spec + bild-URL:er
- [x] kund-preview renderare (mobil först, kundens bilder)

## Kvalitetsgolv för alla kundpreviews
- [x] Kurerat bildbibliotek per bransch (src/assets/stock + src/lib/design/stock.ts)
- [x] Hero har alltid relevant bild med läsbar overlay
- [x] Highlight- och galleri-sektioner byggs alltid, fylls med kundens bilder först
- [x] Djup: lager, gradients, överlappande kort, varierade sektionstoner
- [x] Bleka kundfärger blir tint i stället för primärfärg (#cbf0ff)
- [x] Ny Isolasweets-preview (ORD-MCG8J7) genererad och testad mobil + desktop

## QA-testbatteri (designmotor)
- [x] 20 [TEST]-ansökningar (TEST-001..020) seedade med status archived + design_spec
- [x] Skript: scripts/generate-test-applications.ts (bun scripts/generate-test-applications.ts)
- [x] Nya branscher: automotive, hospitality. Bättre svensk färgtolkning (längsta ordet vinner, fler färgord)
- [x] Alla 20 previews renderade mobilt utan fel, 0 trasiga bilder, build OK

<!-- production redeploy trigger: testgalleri -->

## Framtida idé — AI Hub / kontrollpanel
- [ ] Bygg en egen central AI-kontrollpanel när Din Webbpartner-flödet är stabilt.
- [ ] Visa alla projekt, GitHub/Vercel/Lovable-status, kundflöden, logs och deploys i realtid.
- [ ] Ha en inbyggd AI-chat som kan starta jobb och styra verktyg från samma gränssnitt.
- [ ] Designa lösningen modellagnostiskt så olika AI-modeller kan användas för olika uppgifter vid behov.
