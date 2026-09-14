
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

<!-- redeploy resend preview flow 2026-09-12 -->

## Produktionshärdning av hubben (pågår)
- [ ] Enhetlig DB-väg + preview_email_log (PGRST205)
- [ ] Migration: design_versions, revision_jobs, utökade kolumner
- [ ] AI-router för inkommande kundsvar
- [ ] Immutable designversioner + QA-gate i loopen
- [ ] Kundkvittens/automails med idempotency
- [ ] Inbound-härdning + health check
- [ ] Retry/recovery + integrationstester

## Produktionshärdning av hubben (klar i kod)
- [x] En enda databasväg för hela hubben (src/lib/hub/db.ts) + självläkande schema — fixar PGRST205/preview_email_log
- [x] Immutable design_versions + revision_jobs (queued/processing/succeeded/failed/needs_review, retry_count, last_error, idempotency_key)
- [x] AI-router för kundsvar (design_changes, design_approved, question_*, unclear) med konservativt godkännande
- [x] Kundmail: kvittens på ändringar, bekräftat godkännande, kvittens/automatsvar på frågor — allt idempotent loggat
- [x] Aktiv health check (databas, schema, Resend-nyckel, avsändardomän, mottagningsdomän, webhook-nyckel, endpoint-probe, generator, maillogg)
- [ ] Externt: MX för reply.dinwebbpartner.com, webhook till /api/public/inbound-email, INBOUND_EMAIL_WEBHOOK_SECRET i driftmiljön
