import * as React from 'react'
import { render } from '@react-email/components'
import { createClient } from '@supabase/supabase-js'
import { createFileRoute } from '@tanstack/react-router'
import postgres from 'postgres'
import { z } from 'zod'
import { TEMPLATES } from '@/lib/email-templates/registry'
import { previewSendGate } from '@/lib/design/quality'
import { getUnsubscribeToken } from '@/lib/unsubscribe-token.server'
import { replyAddressFor } from '@/lib/email/reply-address'
import { withHub } from '@/lib/hub/db'
import { hubSender, sendHubEmail } from '@/lib/hub/mail'


const SITE_NAME = 'Din Webbpartner'
const SENDER_DOMAIN = 'notify.dinwebbpartner.com'
const FROM_DOMAIN = 'dinwebbpartner.com'

const schema = z.object({
  reference: z.string().trim().min(4).max(40),
  recipient: z.string().trim().email().max(255).optional(),
})

const TEST_REF = /^TEST-/i
const BLOCKED_RECIPIENT_DOMAINS = ['exempel.se', 'example.com', 'example.se', 'example.org', 'test.se']

function authorized(request: Request) {
  const expected = process.env.ADMIN_ACCESS_KEY
  const provided = request.headers.get('x-admin-key')
  return Boolean(expected && provided && provided === expected)
}

function databaseUrl() {
  return (
    process.env.POSTGRES_URL ||
    process.env.STORAGE_POSTGRES_URL ||
    process.env.STORAGE_DATABASE_URL ||
    process.env.DATABASE_URL ||
    process.env.SUPABASE_DB_URL
  )
}

function emailProvider() {
  const url = import.meta.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY
  if (!url || !key) {
    return {
      ok: false as const,
      missing: !url ? 'VITE_SUPABASE_URL / SUPABASE_URL' : 'SUPABASE_SERVICE_ROLE_KEY',
    }
  }
  return { ok: true as const, client: createClient<any>(url, key, { auth: { persistSession: false, autoRefreshToken: false } }) }
}

function maskEmail(email: string) {
  const [local = '', domain = ''] = email.split('@')
  const head = local.slice(0, 1)
  return `${head}${'*'.repeat(Math.max(local.length - 1, 1))}@${domain}`
}

type LogRow = {
  id?: string
  reference: string
  company?: string | null
  recipient: string
  preview_url?: string | null
  sender?: string | null
  provider: string
  provider_message_id?: string | null
  status: string
  error_message?: string | null
  sent_at?: string | null
}

/** Never store secrets here — only routing metadata and provider ids. */
async function logSend(client: any, row: LogRow): Promise<string | null> {
  try {
    const { data, error } = await client.from('preview_email_log').insert(row).select('id').single()
    if (error) throw error
    return (data?.id as string) ?? null
  } catch (e) {
    console.error('send-preview: log insert failed', e)
    return null
  }
}

async function updateLog(client: any, id: string | null, patch: Partial<LogRow>) {
  if (!id) return
  try {
    await client.from('preview_email_log').update(patch).eq('id', id)
  } catch (e) {
    console.error('send-preview: log update failed', e)
  }
}

type AppRow = {
  reference: string
  company?: string
  name?: string
  email?: string
  preview_url?: string
  qa_status?: string | null
  qa_report?: any
  qa_accepted_at?: string | null
}

/**
 * Reads an application without assuming the newest schema exists.
 * `SELECT *` keeps older databases (before the QA/design columns landed)
 * working — a named column list made the whole read fail there.
 * If the direct Postgres connection is unavailable or fails, we fall back to
 * the service-role Data API so an existing application is never unreadable.
 */
async function loadApplication(reference: string): Promise<AppRow | null> {
  const ref = reference.trim().toUpperCase()
  const dbUrl = databaseUrl()
  let firstError: unknown = null

  if (dbUrl) {
    const sql = postgres(dbUrl, { max: 1, prepare: false })
    try {
      const rows = await sql`
        SELECT * FROM public.project_applications
        WHERE upper(reference) = ${ref}
        LIMIT 1
      `
      const row = (rows as any[])[0]
      if (row) return row as AppRow
      return null
    } catch (e) {
      firstError = e
      console.error('send-preview: postgres read failed, falling back to Data API', e)
    } finally {
      await sql.end({ timeout: 5 }).catch(() => undefined)
    }
  }

  const provider = emailProvider()
  if (!provider.ok) {
    if (firstError) throw firstError
    return null
  }
  const { data, error } = await provider.client
    .from('project_applications')
    .select('*')
    .eq('reference', ref)
    .maybeSingle()
  if (error) throw error
  return (data as AppRow) || null
}



/** Renders the shared preview-ready template for a given application. */
async function renderPreviewEmail(app: AppRow) {
  const entry = TEMPLATES['preview-ready']
  const data = {
    name: app.name,
    company: app.company?.replace('[TEST] ', ''),
    previewUrl: app.preview_url,
    reference: app.reference,
  }
  const element = React.createElement(entry.component, data)
  return {
    html: await render(element),
    text: await render(element, { plainText: true }),
    subject: typeof entry.subject === 'function' ? entry.subject(data) : entry.subject,
  }
}

export const Route = createFileRoute('/api/admin/send-preview')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        if (!authorized(request)) return Response.json({ error: 'Unauthorized' }, { status: 401 })
        const url = new URL(request.url)
        const reference = (url.searchParams.get('reference') || '').trim().toUpperCase()

        // Visual template preview for the admin panel (renders, never sends).
        if (url.searchParams.get('mode') === 'html') {
          if (!reference) return Response.json({ error: 'reference krävs' }, { status: 400 })
          let app: AppRow | null = null
          try { app = await loadApplication(reference) }
          catch (e) {
            console.error('send-preview: preview read failed', e)
            return Response.json({ error: 'Kunde inte läsa ansökan', detail: String((e as any)?.message || e).slice(0, 200) }, { status: 500 })

          }
          if (!app) return Response.json({ error: 'Ansökan hittades inte' }, { status: 404 })
          const rendered = await renderPreviewEmail(app)
          return Response.json({ subject: rendered.subject, html: rendered.html, text: rendered.text })
        }

        // Mail history is read over the SAME Postgres connection the rest of the
        // hub uses. Reading it over the Data API is what produced the production
        // PGRST205 "preview_email_log missing" error: the two paths resolved to
        // different databases.
        try {
          const rows = await withHub(async (sql) =>
            reference
              ? sql`SELECT id, reference, company, recipient, preview_url, sender, provider, provider_message_id,
                           status, kind, revision, error_message, sent_at, delivered_at, created_at, updated_at
                    FROM public.preview_email_log WHERE upper(reference) = ${reference}
                    ORDER BY created_at DESC LIMIT 40`
              : sql`SELECT id, reference, company, recipient, preview_url, sender, provider, provider_message_id,
                           status, kind, revision, error_message, sent_at, delivered_at, created_at, updated_at
                    FROM public.preview_email_log ORDER BY created_at DESC LIMIT 100`,
          )
          const logs = (rows as any[]).map((row) => ({
            ...row,
            recipient_masked: maskEmail(String(row.recipient || '')),
          }))
          return Response.json({ logs })
        } catch (e) {
          const message = String((e as any)?.message || e)
          if (/relation .*preview_email_log.* does not exist/i.test(message)) {
            return Response.json({ logs: [], unavailable: 'preview_email_log saknas i databasen' })
          }
          console.error('send-preview: history read failed', e)
          return Response.json({ error: 'Kunde inte läsa mailhistorik', detail: message.slice(0, 200) }, { status: 500 })
        }

      },
      POST: async ({ request }) => {
        if (!authorized(request)) return Response.json({ error: 'Unauthorized' }, { status: 401 })

        let input
        try { input = schema.parse(await request.json()) }
        catch { return Response.json({ error: 'Invalid input' }, { status: 400 }) }

        const reference = input.reference.toUpperCase()

        // Load the application (prefer the same Postgres connection the rest of admin uses).
        let app: AppRow | null = null
        try {
          app = await loadApplication(reference)
        } catch (e) {
          console.error('send-preview: db read failed', e)
          return Response.json({ error: 'Kunde inte läsa ansökan', detail: String((e as any)?.message || e).slice(0, 200) }, { status: 500 })

        }


        if (!app) return Response.json({ error: 'Ansökan hittades inte' }, { status: 404 })
        if (!app.preview_url) {
          return Response.json({ error: 'Ingen preview-länk finns för den här ansökan' }, { status: 400 })
        }

        // Automatic QA gate: blocked previews can never be sent, review previews
        // require an explicit admin acceptance recorded on the application.
        const gate = previewSendGate(
          app.qa_status ? { status: app.qa_status as any, checks: app.qa_report?.checks || [] } : null,
          Boolean(app.qa_accepted_at),
        )
        if (!gate.sendable) {
          return Response.json(
            { error: gate.reason, qaStatus: app.qa_status, qaBlocked: app.qa_status === 'blocked' },
            { status: 409 },
          )
        }

        // Recipient rules
        let recipient: string
        if (TEST_REF.test(reference)) {
          if (!input.recipient) {
            return Response.json(
              { error: 'Testansökningar kräver en uttrycklig, säker mottagaradress' },
              { status: 400 },
            )
          }
          recipient = input.recipient.toLowerCase()
          if (app.email && recipient === String(app.email).toLowerCase()) {
            return Response.json({ error: 'Testmottagaren får inte vara testfallets fejkadress' }, { status: 400 })
          }
        } else {
          recipient = (input.recipient || app.email || '').toLowerCase()
          if (!recipient) return Response.json({ error: 'Ansökan saknar e-postadress' }, { status: 400 })
        }

        const domain = recipient.split('@')[1] || ''
        if (BLOCKED_RECIPIENT_DOMAINS.includes(domain)) {
          return Response.json({ error: `Ogiltig mottagardomän: ${domain}` }, { status: 400 })
        }

        const provider = emailProvider()
        if (!provider.ok && !process.env.RESEND_API_KEY) {
          return Response.json(
            {
              error: 'E-postleverantör saknas — inget mail skickades.',
              missingEnv: provider.missing,
              provider: 'Lovable Email (notify.dinwebbpartner.com)',
            },
            { status: 503 },
          )
        }

        const entry = TEMPLATES['preview-ready']
        const data = {
          name: app.name,
          company: app.company?.replace('[TEST] ', ''),
          previewUrl: app.preview_url,
          reference: app.reference,
        }
        const element = React.createElement(entry.component, data)
        const html = await render(element)
        const text = await render(element, { plainText: true })
        const subject = typeof entry.subject === 'function' ? entry.subject(data) : entry.subject
        const messageId = crypto.randomUUID()

        // Primary provider: Resend on the verified dinwebbpartner.com domain.
        // Sending, logging and the timeline event all go through the unified hub
        // database path, so the admin panel can never lose a send record again.
        const resendKey = process.env.RESEND_API_KEY
        if (resendKey) {
          const revision = (app as any).design_revision ?? (app as any).design_spec?.revision ?? null
          try {
            const result = await withHub((sql) =>
              sendHubEmail(sql, {
                reference: app!.reference,
                kind: 'preview_ready',
                templateKey: 'preview-ready',
                data,
                recipient,
                company: app!.company,
                previewUrl: app!.preview_url,
                revision,
                idempotencyKey: `preview-${app!.reference}-r${revision ?? 0}-${messageId}`,
              }),
            )
            if (!result.sent) {
              return Response.json(
                { error: 'E-post kunde inte skickas', detail: result.reason, sender: hubSender() },
                { status: result.reason?.startsWith('resend_') ? 502 : 500 },
              )
            }
            return Response.json({ success: true, recipient, messageId: result.messageId ?? messageId, provider: 'resend' })
          } catch (e) {
            console.error('send-preview: resend send failed', e)
            return Response.json(
              { error: 'Kunde inte skicka previewmailet via Resend', detail: String((e as any)?.message || e).slice(0, 200) },
              { status: 500 },
            )
          }
        }


        if (!provider.ok) {
          return Response.json(
            { error: 'E-postleverantör saknas — inget mail skickades.', missingEnv: provider.missing },
            { status: 503 },
          )
        }

        const queueLogId = await logSend(provider.client, {
          reference: app.reference,
          company: app.company ?? null,
          recipient,
          preview_url: app.preview_url ?? null,
          sender: `${SITE_NAME} <noreply@${FROM_DOMAIN}>`,
          provider: 'lovable-email',
          provider_message_id: messageId,
          status: 'queued',
        })

        try {
          await provider.client.from('email_send_log').insert({
            message_id: messageId,
            template_name: 'preview-ready',
            recipient_email: recipient,
            status: 'pending',
          })

          const unsubscribeToken = await getUnsubscribeToken(provider.client, recipient)

          const { error } = await provider.client.rpc('enqueue_email', {
            queue_name: 'transactional_emails',
            payload: {
              message_id: messageId,
              to: recipient,
              from: `${SITE_NAME} <noreply@${FROM_DOMAIN}>`,
              sender_domain: SENDER_DOMAIN,
              subject,
              html,
              text,
              purpose: 'transactional',
              label: 'preview-ready',
              idempotency_key: `preview-ready-${reference}-${messageId}`,
              unsubscribe_token: unsubscribeToken,
              queued_at: new Date().toISOString(),
            },
          })
          if (error) throw error
          await updateLog(provider.client, queueLogId, { status: 'sent', sent_at: new Date().toISOString() })
        } catch (e) {
          console.error('send-preview: enqueue failed', e)
          await updateLog(provider.client, queueLogId, { status: 'failed', error_message: 'Kunde inte köa previewmailet' })
          return Response.json({ error: 'Kunde inte skicka previewmailet' }, { status: 500 })
        }

        await provider.client
          .from('application_events')
          .insert({ reference, event_type: 'preview_sent', label: 'Previewmail skickat', details: { messageId } })
          .then(() => undefined, () => undefined)

        return Response.json({ success: true, recipient, messageId })
      },
    },
  },
})
