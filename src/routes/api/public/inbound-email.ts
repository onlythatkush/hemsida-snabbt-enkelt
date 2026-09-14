import { createFileRoute } from '@tanstack/react-router'
import postgres from 'postgres'
import { DESIGN_SPEC_VERSION, composeDesignSpec } from '@/lib/design/compose'
import { cleanReplyText, parseRevisionRequest } from '@/lib/revision/parse'
import { classifyReply } from '@/lib/revision/intent'
import { matchInboundReference } from '@/lib/revision/match'
import { verifyWebhookSignature } from '@/lib/revision/webhook'
import type { InboundEmail } from '@/lib/revision/types'

function databaseUrl() {
  return (
    process.env.POSTGRES_URL ||
    process.env.STORAGE_POSTGRES_URL ||
    process.env.STORAGE_DATABASE_URL ||
    process.env.DATABASE_URL ||
    process.env.SUPABASE_DB_URL
  )
}

function asArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((v) => String(v))
  if (typeof value === 'string' && value.trim()) return value.split(/[,\s]+/).filter(Boolean)
  return []
}

/** Normalises Resend / generic inbound payloads into our provider-agnostic shape. */
export function normalizeInbound(payload: any): InboundEmail {
  const d = payload?.data ?? payload ?? {}
  const headers = d.headers ?? {}
  const header = (name: string) =>
    headers[name] ?? headers[name.toLowerCase()] ?? headers[name.toUpperCase()] ?? null
  return {
    messageId: d.message_id ?? d.messageId ?? header('Message-Id') ?? null,
    inReplyTo: d.in_reply_to ?? d.inReplyTo ?? header('In-Reply-To') ?? null,
    references: asArray(d.references ?? header('References')),
    to: asArray(d.to),
    cc: asArray(d.cc),
    from: typeof d.from === 'string' ? d.from : (d.from?.address ?? null),
    subject: d.subject ?? null,
    text: d.text ?? null,
    html: d.html ?? null,
  }
}

/** Production databases may predate the review-loop migration. */
async function ensureColumns(sql: any) {
  try {
    await sql`ALTER TABLE public.customer_change_requests ADD COLUMN IF NOT EXISTS intent TEXT`
    await sql`ALTER TABLE public.customer_change_requests ADD COLUMN IF NOT EXISTS intent_reason TEXT`
    await sql`ALTER TABLE public.customer_change_requests ADD COLUMN IF NOT EXISTS subject TEXT`
    await sql`ALTER TABLE public.project_applications ADD COLUMN IF NOT EXISTS design_revision INTEGER`
    await sql`ALTER TABLE public.project_applications ADD COLUMN IF NOT EXISTS customer_approved_at TIMESTAMPTZ`
    await sql`ALTER TABLE public.project_applications ADD COLUMN IF NOT EXISTS review_note TEXT`
  } catch {
    /* schema is normally managed by migrations */
  }
}

export const Route = createFileRoute('/api/public/inbound-email')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const raw = await request.text()
        const verified = await verifyWebhookSignature(
          process.env.INBOUND_EMAIL_WEBHOOK_SECRET,
          {
            id: request.headers.get('svix-id') ?? request.headers.get('webhook-id'),
            timestamp: request.headers.get('svix-timestamp') ?? request.headers.get('webhook-timestamp'),
            signature: request.headers.get('svix-signature') ?? request.headers.get('webhook-signature'),
          },
          raw,
        )
        if (!verified.ok) {
          if (verified.reason === 'missing_secret') {
            console.error('[inbound-email] INBOUND_EMAIL_WEBHOOK_SECRET is not configured')
            return Response.json({ error: 'Inbound email not configured', missingEnv: 'INBOUND_EMAIL_WEBHOOK_SECRET' }, { status: 500 })
          }
          console.warn('[inbound-email] rejected payload:', verified.reason)
          return Response.json({ error: 'Invalid signature' }, { status: 401 })
        }

        let payload: any
        try { payload = JSON.parse(raw) } catch { return Response.json({ error: 'Invalid payload' }, { status: 400 }) }
        const email = normalizeInbound(payload)
        if (!email.messageId) return Response.json({ error: 'Missing message id' }, { status: 400 })

        const url = databaseUrl()
        if (!url) return Response.json({ error: 'Database not configured' }, { status: 500 })
        const sql = postgres(url, { max: 1, prepare: false })

        try {
          await ensureColumns(sql)

          // Only message ids we actually sent may resolve a thread.
          const sent = await sql<{ provider_message_id: string; reference: string }[]>`
            SELECT provider_message_id, reference FROM public.preview_email_log
            WHERE provider_message_id IS NOT NULL
            ORDER BY created_at DESC LIMIT 500
          `.catch(() => [] as { provider_message_id: string; reference: string }[])
          const threadLookup: Record<string, string> = {}
          for (const row of sent) threadLookup[row.provider_message_id] = row.reference

          const match = matchInboundReference(email, threadLookup)
          if (!match) {
            console.warn('[inbound-email] no reference match for message')
            return Response.json({ ok: true, matched: false }, { status: 202 })
          }

          const body = cleanReplyText(email.text || email.html || '')
          const intent = classifyReply(body)
          const directives = parseRevisionRequest(body)

          // Idempotency: the same provider message can only ever create one row.
          const inserted = await sql`
            INSERT INTO public.customer_change_requests
              (reference, raw_text, directives, from_email, message_id, matched_via, status,
               intent, intent_reason, subject)
            VALUES (${match.reference}, ${body}, ${sql.json(directives as any)}, ${email.from ?? null},
                    ${email.messageId}, ${match.via}, 'received',
                    ${intent.intent}, ${intent.reason}, ${email.subject ?? null})
            ON CONFLICT (message_id) DO NOTHING
            RETURNING id
          `
          if (!inserted.length) {
            return Response.json({ ok: true, duplicate: true, reference: match.reference })
          }
          const changeRequestId = (inserted[0] as any).id

          const replyLabel =
            intent.intent === 'approved'
              ? 'Kunden godkände designen'
              : intent.intent === 'changes'
                ? 'Kunden svarade med ändringar'
                : 'Kundsvar behöver granskas'
          await sql`
            INSERT INTO public.application_events (reference, event_type, label, details)
            VALUES (${match.reference}, 'customer_replied', ${replyLabel},
                    ${sql.json({ matchedVia: match.via, intent: intent.intent, reason: intent.reason, summary: directives.summary } as any)})
          `

          const found = await sql`SELECT * FROM public.project_applications WHERE reference = ${match.reference} LIMIT 1`
          if (!found.length) {
            await sql`UPDATE public.customer_change_requests SET status = 'failed', error = 'application_not_found' WHERE id = ${changeRequestId}`
            return Response.json({ ok: true, matched: false, reference: match.reference }, { status: 202 })
          }
          const app = found[0] as any

          // B) Clear approval: stop the revision loop. No later delivery step here.
          if (intent.intent === 'approved') {
            await sql`
              UPDATE public.project_applications
              SET status = 'approved',
                  customer_approved_at = now(),
                  design_locked = true,
                  review_note = NULL,
                  updated_at = now()
              WHERE reference = ${app.reference}
            `
            await sql`
              UPDATE public.customer_change_requests
              SET status = 'approved', processed_at = now() WHERE id = ${changeRequestId}
            `
            await sql`
              INSERT INTO public.application_events (reference, event_type, label, details)
              VALUES (${app.reference}, 'customer_approved', 'Godkänd av kund',
                      ${sql.json({ signals: intent.signals } as any)})
            `
            return Response.json({ ok: true, reference: app.reference, intent: 'approved' })
          }

          // Anything not clearly an approval and not clearly a change request is
          // never acted on automatically — a human reads it first.
          if (intent.intent === 'unclear') {
            await sql`
              UPDATE public.project_applications
              SET review_note = ${intent.reason}, status = 'reviewing', updated_at = now()
              WHERE reference = ${app.reference}
            `
            await sql`
              UPDATE public.customer_change_requests
              SET status = 'needs_review', processed_at = now() WHERE id = ${changeRequestId}
            `
            return Response.json({ ok: true, reference: app.reference, intent: 'unclear' })
          }

          if (app.design_locked) {
            await sql`UPDATE public.customer_change_requests SET status = 'skipped', error = 'design_locked' WHERE id = ${changeRequestId}`
            return Response.json({ ok: true, reference: match.reference, skipped: 'design_locked' })
          }

          // A) Change request: build the next design revision automatically.
          const revision = (Number(app.design_spec?.revision) || Number(app.design_revision) || 0) + 1
          const spec = composeDesignSpec(
            {
              reference: app.reference,
              company: app.company,
              description: app.description,
              website_type: app.website_type,
              colors: app.colors,
              extra_requests: app.extra_requests,
              social_links: app.social_links,
              address: app.address,
              email: app.email,
              phone: app.phone,
              file_names: Array.isArray(app.file_names) ? app.file_names : [],
            },
            { revision, directives },
          )

          const token: string =
            app.preview_token && String(app.preview_token).length >= 32
              ? String(app.preview_token)
              : crypto.randomUUID().replaceAll('-', '') + crypto.randomUUID().replaceAll('-', '')
          const origin = new URL(request.url).origin
          const previewUrl =
            `${origin}/kund-preview/${encodeURIComponent(app.reference)}?token=${token}` +
            `&v=${revision}-${Date.now().toString(36)}`

          const qa = spec.qa
          await sql`
            UPDATE public.project_applications
            SET preview_token = ${token},
                preview_url = ${previewUrl},
                design_spec = ${sql.json(spec as any)},
                design_family = ${spec.family},
                design_revision = ${revision},
                qa_status = ${qa?.status ?? null},
                qa_score = ${qa?.score ?? null},
                qa_report = ${qa ? sql.json({ ...qa, designVersion: DESIGN_SPEC_VERSION, revision } as any) : null},
                qa_accepted_at = NULL,
                review_note = ${directives.unparsed ? 'Ändringarna kunde inte tolkas fullt ut – läs kundsvaret' : null},
                status = 'changes',
                updated_at = now()
            WHERE reference = ${app.reference}
          `

          await sql`
            UPDATE public.customer_change_requests
            SET status = 'applied', revision = ${revision}, processed_at = now()
            WHERE id = ${changeRequestId}
          `
          await sql`
            INSERT INTO public.application_events (reference, event_type, label, details)
            VALUES (${app.reference}, 'revision_generated', ${'Ny version ' + revision + ' skapad'},
                    ${sql.json({ revision, family: spec.family, qaStatus: qa?.status, qaScore: qa?.score, summary: directives.summary } as any)})
          `

          // Never auto-send. Admin decides, and the QA gate still applies.
          return Response.json({
            ok: true,
            reference: app.reference,
            intent: 'changes',
            revision,
            qaStatus: qa?.status,
            qaScore: qa?.score,
            directives: directives.summary,
          })
        } catch (error) {
          console.error('[inbound-email] processing failed', error)
          // Retry-safe: the provider may redeliver; idempotency guards duplicates.
          return Response.json({ error: 'Processing failed' }, { status: 500 })
        } finally {
          await sql.end()
        }
      },
    },
  },
})
