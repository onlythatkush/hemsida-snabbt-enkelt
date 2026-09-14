import { DESIGN_SPEC_VERSION, composeDesignSpec } from '@/lib/design/compose'
import type { RevisionDirectives } from '@/lib/revision/types'
import { logEvent, type HubSql } from './db'
import { claimJob, finishJob } from './jobs'
import { nextRevision, recordDesignVersion } from './versions'
import { sendHubEmail } from './mail'

/**
 * The one place a customer revision is produced.
 *
 * Used by the inbound webhook and by the admin "kör om" action, so a retry can
 * never take a different code path than the original run. The job idempotency
 * key is derived from the change request: a redelivered webhook is a no-op,
 * while an admin retry of a failed job reuses the same job row.
 */
export type RevisionOutcome = {
  ok: boolean
  duplicateJob?: boolean
  revision?: number
  qaStatus?: string
  qaScore?: number
  autoSent?: boolean
  autoSendReason?: string
  error?: string
}

export async function runRevisionJob(
  sql: HubSql,
  input: {
    app: any
    changeRequestId: string
    directives: RevisionDirectives
    summary: string[]
    origin: string
    mailAllowed: boolean
    /** Send the "we received your changes" acknowledgement (skip on retries). */
    sendAck?: boolean
    source?: 'customer_reply' | 'retry'
  },
): Promise<RevisionOutcome> {
  const { app, changeRequestId, directives, origin } = input
  const job = await claimJob(sql, {
    reference: app.reference,
    changeRequestId,
    idempotencyKey: `revision-${changeRequestId}`,
  })
  if (!job) return { ok: true, duplicateJob: true }

  try {
    const revision = await nextRevision(
      sql,
      app.reference,
      Math.max(Number(app.design_spec?.revision) || 0, Number(app.design_revision) || 0),
    )

    // The generator always rebuilds from the customer's own application data
    // plus the accumulated directives — never from a stale stored render.
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
    const previewUrl =
      `${origin}/kund-preview/${encodeURIComponent(app.reference)}?token=${token}` +
      `&v=${revision}-${Date.now().toString(36)}`

    const qa = spec.qa
    await recordDesignVersion(sql, {
      reference: app.reference,
      revision,
      designSpec: spec,
      designFamily: spec.family,
      designVersion: DESIGN_SPEC_VERSION,
      previewUrl,
      qaStatus: qa?.status ?? null,
      qaScore: qa?.score ?? null,
      qaReport: qa ? { ...qa, designVersion: DESIGN_SPEC_VERSION, revision } : null,
      source: input.source ?? 'customer_reply',
      changeRequestId,
    })

    await sql`
      UPDATE public.project_applications
      SET preview_token=${token},
          preview_url=${previewUrl},
          design_spec=${sql.json(spec as any)},
          design_family=${spec.family},
          design_revision=${revision},
          qa_status=${qa?.status ?? null},
          qa_score=${qa?.score ?? null},
          qa_report=${qa ? sql.json({ ...qa, designVersion: DESIGN_SPEC_VERSION, revision } as any) : null},
          qa_accepted_at=NULL,
          review_note=${directives.unparsed ? 'Ändringarna kunde inte tolkas fullt ut – läs kundsvaret' : null},
          status='changes',
          updated_at=now()
      WHERE reference=${app.reference}
    `
    await sql`
      UPDATE public.customer_change_requests
      SET status='applied', revision=${revision}, processed_at=now(), last_error=NULL WHERE id=${changeRequestId}
    `
    await logEvent(sql, app.reference, 'revision_generated', `Ny version ${revision} skapad`, {
      revision, family: spec.family, qaStatus: qa?.status, qaScore: qa?.score,
      summary: input.summary, jobId: job.id, retryCount: job.retryCount, source: input.source ?? 'customer_reply',
    })

    if (input.mailAllowed && input.sendAck !== false) {
      await sendHubEmail(sql, {
        reference: app.reference,
        kind: 'change_received',
        templateKey: 'change-received',
        data: {
          eyebrow: 'Ändringar mottagna',
          heading: 'Tack — vi har tagit emot dina ändringar',
          intro:
            'Vi har läst ditt svar och arbetar nu på en ny version av sidan. Du får ett nytt mail så snart den är klar att titta på.',
          name: app.name,
          company: String(app.company || '').replace('[TEST] ', ''),
          reference: app.reference,
          bulletsTitle: 'Det här har vi tolkat',
          bullets: input.summary.length
            ? input.summary.slice(0, 6).map((s) => String(s).slice(0, 120))
            : ['Vi går igenom ditt svar manuellt för att inte missa något.'],
        },
        recipient: app.email,
        company: app.company,
        revision,
        changeRequestId,
        idempotencyKey: `changeack-${changeRequestId}`,
      })
    }

    let autoSend: { sent: boolean; reason?: string } = { sent: false, reason: `qa_${qa?.status ?? 'unknown'}` }
    if (qa?.status === 'ready') {
      autoSend = input.mailAllowed
        ? await sendHubEmail(sql, {
            reference: app.reference,
            kind: 'preview_ready',
            templateKey: 'preview-ready',
            data: {
              name: app.name,
              company: String(app.company || '').replace('[TEST] ', ''),
              previewUrl,
              reference: app.reference,
            },
            recipient: app.email,
            company: app.company,
            previewUrl,
            revision,
            changeRequestId,
            idempotencyKey: `preview-${app.reference}-r${revision}`,
          })
        : { sent: false, reason: 'test_reference' }

      if (autoSend.sent) {
        await sql`UPDATE public.customer_change_requests SET status='sent' WHERE id=${changeRequestId}`
      } else {
        await logEvent(sql, app.reference, 'preview_send_pending', 'Ny version väntar på admin för utskick', {
          revision, reason: autoSend.reason,
        })
      }
    } else {
      await logEvent(
        sql,
        app.reference,
        qa?.status === 'blocked' ? 'preview_blocked' : 'preview_needs_admin',
        qa?.status === 'blocked'
          ? `Version ${revision} blockerad av kvalitetskontrollen`
          : `Version ${revision} har varningar och kräver admingodkännande`,
        { revision, qaStatus: qa?.status, qaScore: qa?.score },
      )
    }

    await finishJob(sql, job.id, qa?.status === 'blocked' ? 'needs_review' : 'succeeded', {
      revision,
      detail: { qaStatus: qa?.status ?? null, autoSent: autoSend.sent === true },
    })

    return {
      ok: true,
      revision,
      qaStatus: qa?.status,
      qaScore: qa?.score,
      autoSent: autoSend.sent === true,
      autoSendReason: autoSend.sent ? undefined : autoSend.reason,
    }
  } catch (error) {
    const message = String((error as any)?.message || error)
    console.error('[hub] revision job failed', error)
    await finishJob(sql, job.id, 'failed', { lastError: message })
    await sql`
      UPDATE public.customer_change_requests
      SET status='failed', last_error=${message.slice(0, 400)} WHERE id=${changeRequestId}
    `.catch(() => undefined)
    await logEvent(sql, app.reference, 'revision_failed', 'Ny version kunde inte skapas', {
      error: message.slice(0, 300),
    })
    return { ok: false, error: message }
  }
}
