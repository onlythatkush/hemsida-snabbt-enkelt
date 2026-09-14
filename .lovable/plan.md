# Produktionshärdning av hubben

## Grundorsak till PGRST205

Ordrar, ändringsförfrågningar och händelser läses via en direkt databasanslutning
(`POSTGRES_URL` → … → `SUPABASE_DB_URL`), medan mejlloggen (`preview_email_log`)
läses och skrivs via Data API:t med service role-nyckeln. I produktion pekar de två
vägarna inte på samma databas, så mejlloggen "saknas" (PGRST205) trots att tabellen
finns i migrationerna.

Åtgärd: all hubb-data går genom **en** databasväg. Mejlloggen läses/skrivs med samma
anslutning som ordrarna, och migrationerna körs mot den databasen.

## 1. Schema (idempotent migration)

Går igenom varje tabell/kolumn som körkoden faktiskt använder och säkrar dem:

- `project_applications` – alla design-/QA-/review-kolumner
- `preview_email_log` – utökas med `kind`, `revision`, `idempotency_key` (unik),
  `change_request_id`, index på `reference`, `provider_message_id`
- `customer_change_requests` – utökas med `category`, `confidence`, `extracted`,
  `routing`, `retry_count`, `last_error`, `answered_at`
- `application_events` – index på `reference, created_at`
- **ny** `design_versions` – immutable historik: `reference`, `revision`,
  `design_spec`, `design_family`, `preview_url`, `qa_status`, `qa_score`,
  `qa_report`, `created_at`. Unik på (reference, revision). Skrivs aldrig över.
- **ny** `revision_jobs` – `reference`, `change_request_id`, `status`
  (queued/processing/succeeded/failed/needs_review), `retry_count`, `last_error`,
  `idempotency_key` unik, tidsstämplar

Alla tabeller får GRANT + RLS med service role-policy (ingen publik åtkomst).

## 2. Hubben som orkestrator

Timeline per `reference` byggs av `application_events` + härledda rader från
design_versions, mejllogg och kundsvar. Händelsetyper täcker: ansökan mottagen,
filer, designversion skapad, QA-resultat, mail skickat/misslyckat, kundsvar,
AI-tolkning, ändringsjobb (kö/start/klar/fel/retry), godkännande, manuell åtgärd.
Adminvyn behåller nuvarande utseende – timelinen fylls med fler poster och
versionshistorik, ingen redesign.

## 3. AI-router för inkommande svar

Ny modul `src/lib/revision/router.ts`:

1. Deterministisk regelmotor först (svenska fraser) → kategori + confidence + reason.
2. Är signalen svag anropas Lovable AI (redan tillgänglig nyckel) för klassificering
   i kategorierna `design_changes`, `design_approved`, `question_design`,
   `question_process`, `question_payment`, `question_other`, `unclear`.
3. **Godkännande får endast sättas av den deterministiska regeln vid explicit
   godkännande utan reservation.** AI:n kan aldrig ensam godkänna.
4. Allt sparas: originaltext, kategori, confidence, reason, extraherad data, routing.
   Låg confidence → `needs_review`.

## 4. Designloop med immutable versioner

`design_changes` → skapar `revision_jobs`-rad → kör befintliga generatorn
(`composeDesignSpec`) → ny rad i `design_versions` (aldrig överskrivning) → QA →
- `ready`: preview uppdateras och mejlas automatiskt
- `review`: väntar på admin
- `blocked`: mejlas aldrig, orsak visas i admin

Obegränsat antal revisioner; `project_applications` pekar bara på senaste versionen
medan historiken ligger kvar.

## 5. Kundkommunikation

Nya svenska mallar i samma visuella system som previewmejlet:

- `change-received` – kvittens med säker sammanfattning av det systemet extraherat
- `approval-confirmed` – bekräftar att version X registrerats som godkänd
- `question-ack` – kvittens på fråga som går till manuell granskning
- `question-answer` – automatsvar endast när svaret kan grundas i orderdata
  (status, version, vad som händer härnäst); annars kvittens + needs_review

Varje utskick loggas med provider message id, kind, revision, status, tidsstämplar
och idempotency key (samma nyckel skickar aldrig två mejl).

## 6. Inbound

Behåller och härdar: Resend `email.received`-format, hämtning av mejltext via
Resend API när webhooken bara har metadata, plus-adressmatchning
`reply+REF@reply.dinwebbpartner.com`, trådfallback, signaturverifiering och
duplikatskydd på `message_id`.

## 7. Health check som verkligen testar

`/api/admin/email-health` byggs ut till aktiva prov och returnerar grönt/gult/rött
plus åtgärdstext per punkt: databasanslutning, varje förväntad tabell/kolumn,
migrationsstatus, `RESEND_API_KEY` (verifieras mot Resend API), avsändardomän,
`INBOUND_EMAIL_WEBHOOK_SECRET`, inbound-endpoint (self-probe), förväntad MX/
mottagardomän, generatorn (torrkörning av `composeDesignSpec` + QA) och mejlloggen.
Inget "redo" utan att underliggande prov gått igenom.

## 8. Fel och recovery

`revision_jobs` och mejlloggen får enhetliga statusar, `retry_count`, `last_error`
och tidsstämplar. Admin får en retry-åtgärd som använder idempotency key, så en
omkörning aldrig ger dubbla versioner eller dubbla mejl.

## Tester

Integrationstester för: saknad tabell, duplicerad webhook, metadata-only-mejl,
plus-adressmatchning, design_changes → ny version → QA → mejl, explicit
godkännande, tvetydig text, frågerouting samt retry/idempotens. Därefter
typkontroll, hela testsviten och bygge.

## Vad som inte görs

Betalning, domänleverans och senare leveranssteg aktiveras inte – routern kan
klassificera frågor om dem och datamodellen är förberedd.
