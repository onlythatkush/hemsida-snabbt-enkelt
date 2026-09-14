import { createFileRoute } from '@tanstack/react-router'
import { cleanReplyText } from '@/lib/revision/parse'
import { routeInbound } from '@/lib/revision/router'
import { matchInboundReference } from '@/lib/revision/match'
import { verifyWebhookSignature } from '@/lib/revision/webhook'
import { resolveInboundEmail } from '@/lib/revision/inbound'
import { logEvent, withHub, type HubSql } from '@/lib/hub/db'
import { runRevisionJob } from '@/lib/hub/revise'
import { sendHubEmail } from '@/lib/hub/mail'

export { normalizeInbound } from '@/lib/revision/inbound'

const TEST_REF = /^TEST-/i

/** Short, sanitised description of what the system actually extracted. */
function safeSummary(summary: string[]): string[] {
  return summary.filter(Boolean).map((s) => String(s).slice(0, 120)).slice(0, 6)
}

function statusLabel(status: string | null | undefined) {
  switch (status) {
    case 'approved': return 'Godkänd av dig'
    case 'changes': return 'Ny version på gång'
    case 'reviewing': return 'Under granskning hos oss'
    case 'preview': return 'Förhandsvisning skickad'
    default: return 'Pågående'
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
            return Response.json(
              { error: 'Inbound email not configured', missingEnv: 'INBOUND_EMAIL_WEBHOOK_SECRET' },
              { status: 500 },
            )
          }
          console.warn('[inbound-email] rejected payload:', verified.reason)
          return Response.json({ error: 'Invalid signature' }, { status: 401 })
        }

        let payload: any
        try { payload = JSON.parse(raw) } catch { return Response.json({ error: 'Invalid payload' }, { status: 400 }) }

        const eventType = String(payload?.type || payload?.event || 'email.received')
        if (eventType && !/received|inbound/i.test(eventType)) {
          return Response.json({ ok: true, ignored: eventType }, { status: 202 })
        }

        // Metadata-only webhooks are completed from the provider API first.
        const { email, fetched, bodyMissing } = await resolveInboundEmail(payload)
        if (!email.messageId) return Response.json({ error: 'Missing message id' }, { status: 400 })
        const inboundMessageId: string = email.messageId

        try {
          return await withHub(async (sql) => {
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
            const routed = bodyMissing
              ? {
                  category: 'unclear' as const,
                  intent: 'unclear' as const,
                  confidence: 0,
                  reason: 'Mejlets innehåll kunde inte hämtas – läs svaret manuellt',
                  classifier: 'rules' as const,
                  signals: [] as string[],
                  routing: 'needs_review' as const,
                  extracted: { directives: { unparsed: true, summary: [] } as any, summary: [], questions: [] },
                }
              : await routeInbound(body, email.subject)
            const directives = routed.extracted.directives

            // Idempotency: the same provider message can only ever create one row.
            const inserted = await sql`
              INSERT INTO public.customer_change_requests
                (reference, raw_text, directives, from_email, message_id, matched_via, status,
                 intent, intent_reason, subject, category, confidence, classifier, extracted, routing)
              VALUES (${match.reference}, ${body}, ${sql.json(directives as any)}, ${email.from ?? null},
                      ${inboundMessageId}, ${match.via}, 'received',
                      ${routed.intent}, ${routed.reason}, ${email.subject ?? null},
                      ${routed.category}, ${routed.confidence}, ${routed.classifier},
                      ${sql.json({ summary: routed.extracted.summary, questions: routed.extracted.questions } as any)},
                      ${routed.routing})
              ON CONFLICT (message_id) DO NOTHING
              RETURNING id
            `
            if (!inserted.length) {
              // Duplicate webhook delivery: never a second revision, never a second email.
              return Response.json({ ok: true, duplicate: true, reference: match.reference })
            }
            const changeRequestId = (inserted[0] as any).id as string

            await logEvent(sql, match.reference, 'customer_replied', replyLabel(routed.category), {
              matchedVia: match.via,
              category: routed.category,
              confidence: routed.confidence,
              reason: routed.reason,
              routing: routed.routing,
              summary: routed.extracted.summary,
              questions: routed.extracted.questions,
              bodyFetched: fetched,
              bodyMissing,
            })

            const found = await sql`SELECT * FROM public.project_applications WHERE upper(reference) = ${match.reference.toUpperCase()} LIMIT 1`
            if (!found.length) {
              await sql`UPDATE public.customer_change_requests SET status='failed', error='application_not_found', last_error='application_not_found' WHERE id=${changeRequestId}`
              return Response.json({ ok: true, matched: false, reference: match.reference }, { status: 202 })
            }
            const app = found[0] as any
            const mailAllowed = !TEST_REF.test(app.reference)

            // ---------- B) Explicit approval: stop the design loop ----------
            if (routed.category === 'design_approved') {
              const approvedRevision = Number(app.design_spec?.revision) || Number(app.design_revision) || 1
              await sql`
                UPDATE public.project_applications
                SET status='approved', customer_approved_at=now(), approved_revision=${approvedRevision},
                    design_locked=true, review_note=NULL, updated_at=now()
                WHERE reference=${app.reference}
              `
              await sql`
                UPDATE public.customer_change_requests
                SET status='approved', revision=${approvedRevision}, processed_at=now() WHERE id=${changeRequestId}
              `
              await logEvent(sql, app.reference, 'customer_approved', `Godkänd av kund (version ${approvedRevision})`, {
                signals: routed.signals, revision: approvedRevision, confidence: routed.confidence,
              })

              let mail: any = { sent: false, reason: 'test_reference' }
              if (mailAllowed) {
                mail = await sendHubEmail(sql, {
                  reference: app.reference,
                  kind: 'approval_confirmed',
                  templateKey: 'approval-confirmed',
                  data: {
                    eyebrow: 'Godkänt',
                    heading: `Tack — version ${approvedRevision} är registrerad som godkänd`,
                    intro: 'Vi har registrerat ditt godkännande och stoppat vidare designändringar. Vi hör av oss med nästa steg.',
                    name: app.name,
                    company: String(app.company || '').replace('[TEST] ', ''),
                    reference: app.reference,
                  },
                  recipient: app.email,
                  company: app.company,
                  revision: approvedRevision,
                  changeRequestId,
                  idempotencyKey: `approval-${app.reference}-${approvedRevision}-${changeRequestId}`,
                })
              }
              return Response.json({ ok: true, reference: app.reference, category: 'design_approved', revision: approvedRevision, mailed: mail.sent === true })
            }

            // ---------- C) Questions ----------
            if (routed.category.startsWith('question')) {
              const groundable = routed.routing === 'auto_answer' && routed.category === 'question_process'
              await sql`
                UPDATE public.project_applications
                SET review_note=${groundable ? null : routed.reason}, status=${groundable ? app.status : 'reviewing'}, updated_at=now()
                WHERE reference=${app.reference}
              `
              const currentRevision = Number(app.design_spec?.revision) || Number(app.design_revision) || 1
              let mail: any = { sent: false, reason: 'test_reference' }
              if (mailAllowed) {
                mail = groundable
                  ? await sendHubEmail(sql, {
                      reference: app.reference,
                      kind: 'question_answer',
                      templateKey: 'question-answer',
                      data: {
                        eyebrow: 'Svar',
                        heading: 'Så ligger ditt projekt till just nu',
                        intro: 'Tack för din fråga! Här är aktuell status för ditt hemsideprojekt.',
                        name: app.name,
                        company: String(app.company || '').replace('[TEST] ', ''),
                        reference: app.reference,
                        bulletsTitle: 'Status',
                        bullets: [
                          `Status: ${statusLabel(app.status)}`,
                          `Senaste version: ${currentRevision}`,
                          app.preview_url ? 'Din senaste förhandsvisning finns kvar på länken nedan.' : 'Förhandsvisningen skickas så snart den är klar.',
                          'När du är nöjd svarar du bara på mailet med "jag godkänner".',
                        ],
                        ctaUrl: app.preview_url || undefined,
                        ctaLabel: 'Se din hemsida',
                        outro: 'Har du fler frågor är det bara att svara på det här mailet.',
                      },
                      recipient: app.email,
                      company: app.company,
                      previewUrl: app.preview_url,
                      revision: currentRevision,
                      changeRequestId,
                      idempotencyKey: `qanswer-${changeRequestId}`,
                    })
                  : await sendHubEmail(sql, {
                      reference: app.reference,
                      kind: 'question_ack',
                      templateKey: 'question-ack',
                      data: {
                        eyebrow: 'Fråga mottagen',
                        heading: 'Vi har tagit emot din fråga',
                        intro: 'Tack för ditt meddelande! En av oss läser igenom det och återkommer personligen så snart som möjligt.',
                        name: app.name,
                        company: String(app.company || '').replace('[TEST] ', ''),
                        reference: app.reference,
                      },
                      recipient: app.email,
                      company: app.company,
                      changeRequestId,
                      idempotencyKey: `qack-${changeRequestId}`,
                    })
              }
              await sql`
                UPDATE public.customer_change_requests
                SET status=${groundable ? 'answered' : 'needs_review'}, processed_at=now(),
                    answered_at=${mail.sent ? new Date() : null}
                WHERE id=${changeRequestId}
              `
              return Response.json({ ok: true, reference: app.reference, category: routed.category, answered: groundable && mail.sent === true })
            }

            // ---------- D) Unclear: never acted on automatically ----------
            if (routed.category === 'unclear' || routed.routing === 'needs_review') {
              await sql`
                UPDATE public.project_applications
                SET review_note=${routed.reason}, status='reviewing', updated_at=now()
                WHERE reference=${app.reference}
              `
              await sql`
                UPDATE public.customer_change_requests
                SET status='needs_review', processed_at=now() WHERE id=${changeRequestId}
              `
              return Response.json({ ok: true, reference: app.reference, category: routed.category, needsReview: true })
            }

            if (app.design_locked) {
              await sql`UPDATE public.customer_change_requests SET status='skipped', error='design_locked' WHERE id=${changeRequestId}`
              return Response.json({ ok: true, reference: match.reference, skipped: 'design_locked' })
            }

            // ---------- A) design_changes: real regeneration ----------
            const outcome = await runRevisionJob(sql, {
              app,
              changeRequestId,
              directives,
              summary: safeSummary(routed.extracted.summary),
              origin: new URL(request.url).origin,
              mailAllowed,
              source: 'customer_reply',
            })
            if (!outcome.ok) return Response.json({ error: 'Revision failed' }, { status: 500 })
            return Response.json({
              reference: app.reference,
              category: 'design_changes',
              ...outcome,
              directives: routed.extracted.summary,
            })
          })
        } catch (error) {
          console.error('[inbound-email] processing failed', error)
          // Retry-safe: the provider may redeliver; idempotency guards duplicates.
          return Response.json({ error: 'Processing failed' }, { status: 500 })
        }
      },
    },
  },
})

function replyLabel(category: string) {
  switch (category) {
    case 'design_approved': return 'Kunden godkände designen'
    case 'design_changes': return 'Kunden svarade med ändringar'
    case 'question_design': return 'Fråga om designen'
    case 'question_process': return 'Fråga om processen'
    case 'question_payment': return 'Fråga om betalning'
    case 'question_other': return 'Övrig fråga från kunden'
    default: return 'Kundsvar behöver granskas'
  }
}
