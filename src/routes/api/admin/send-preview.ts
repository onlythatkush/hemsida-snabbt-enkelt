import * as React from 'react'
import { render } from '@react-email/components'
import { createClient } from '@supabase/supabase-js'
import { createFileRoute } from '@tanstack/react-router'
import postgres from 'postgres'
import { z } from 'zod'
import { TEMPLATES } from '@/lib/email-templates/registry'
import { previewSendGate } from '@/lib/design/quality'
import { getUnsubscribeToken } from '@/lib/unsubscribe-token.server'

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

async function loadApplication(reference: string): Promise<AppRow | null> {
  const dbUrl = databaseUrl()
  if (dbUrl) {
    const sql = postgres(dbUrl, { max: 1, prepare: false })
    try {
      const rows = await sql`
        SELECT reference, company, name, email, preview_url, qa_status, qa_report, qa_accepted_at
        FROM public.project_applications
        WHERE reference = ${reference}
        LIMIT 1
      `
      return ((rows as any[])[0] as AppRow) || null
    } finally {
      await sql.end({ timeout: 5 })
    }
  }
  const provider = emailProvider()
  if (!provider.ok) return null
  const { data } = await provider.client
    .from('project_applications')
    .select('reference, company, name, email, preview_url, qa_status, qa_report, qa_accepted_at')
    .eq('reference', reference)
    .maybeSingle()
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
            return Response.json({ error: 'Kunde inte läsa ansökan' }, { status: 500 })
          }
          if (!app) return Response.json({ error: 'Ansökan hittades inte' }, { status: 404 })
          const rendered = await renderPreviewEmail(app)
          return Response.json({ subject: rendered.subject, html: rendered.html, text: rendered.text })
        }

        const provider = emailProvider()
        if (!provider.ok) return Response.json({ error: 'Database not configured' }, { status: 500 })

        let query = provider.client
          .from('preview_email_log')
          .select('id, reference, company, recipient, preview_url, sender, provider, provider_message_id, status, error_message, sent_at, delivered_at, created_at, updated_at')
          .order('created_at', { ascending: false })
          .limit(reference ? 20 : 100)
        if (reference) query = query.eq('reference', reference)

        const { data, error } = await query
        if (error) {
          const code = String((error as any)?.code || '')
          const message = String((error as any)?.message || '')
          // The log table may not exist yet in an environment that has not run
          // the migration. That must not break the admin panel.
          if (code === 'PGRST205' || code === '42P01' || /preview_email_log/i.test(message)) {
            console.warn('send-preview: preview_email_log missing', code)
            return Response.json({ logs: [], unavailable: 'preview_email_log saknas i databasen' })
          }
          console.error('send-preview: history read failed', error)
          return Response.json({ error: 'Kunde inte läsa mailhistorik' }, { status: 500 })
        }
        const logs = (data || []).map((row: any) => ({
          ...row,
          recipient_masked: maskEmail(String(row.recipient || '')),
        }))
        return Response.json({ logs })
      },
      POST: async ({ request }) => {
        if (!authorized(request)) return Response.json({ error: 'Unauthorized' }, { status: 401 })

        let input
        try { input = schema.parse(await request.json()) }
        catch { return Response.json({ error: 'Invalid input' }, { status: 400 }) }

        const reference = input.reference.toUpperCase()

        // Load the application (prefer the same Postgres connection the rest of admin uses).
        let app: AppRow | null = null
        const dbUrl = databaseUrl()
        if (dbUrl) {
          const sql = postgres(dbUrl, { max: 1, prepare: false })
          try {
            const rows = await sql`
              SELECT reference, company, name, email, preview_url, qa_status, qa_report, qa_accepted_at
              FROM public.project_applications
              WHERE reference = ${reference}
              LIMIT 1
            `
            app = (rows as any[])[0] || null
          } catch (e) {
            console.error('send-preview: db read failed', e)
            return Response.json({ error: 'Kunde inte läsa ansökan' }, { status: 500 })
          } finally {
            await sql.end({ timeout: 5 })
          }
        } else {
          const provider = emailProvider()
          if (!provider.ok) return Response.json({ error: 'Database not configured' }, { status: 500 })
          const { data } = await provider.client
            .from('project_applications')
            .select('reference, company, name, email, preview_url, qa_status, qa_report, qa_accepted_at')
            .eq('reference', reference)
            .maybeSingle()
          app = (data as any) || null
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

        // Fallback provider: Resend (used when the Lovable sender domain is not verified).
        const resendKey = process.env.RESEND_API_KEY
        const logClient = provider.ok ? provider.client : null
        if (resendKey) {
          const from = process.env.RESEND_FROM || 'Din Webbpartner <onboarding@resend.dev>'
          const logId = logClient
            ? await logSend(logClient, {
                reference: app.reference,
                company: app.company ?? null,
                recipient,
                preview_url: app.preview_url ?? null,
                sender: from,
                provider: 'resend',
                status: 'queued',
              })
            : null
          try {
            const res = await fetch('https://api.resend.com/emails', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${resendKey}`,
              },
              body: JSON.stringify({ from, to: [recipient], subject, html, text }),
            })
            if (!res.ok) {
              const body = await res.text()
              console.error(`send-preview: resend failed [${res.status}]: ${body}`)
              await updateLog(logClient, logId, { status: 'failed', error_message: `Resend ${res.status}: ${body}`.slice(0, 500) })
              return Response.json({ error: `Resend: ${res.status} ${body}` }, { status: 502 })
            }
            const out = (await res.json()) as { id?: string }
            await updateLog(logClient, logId, {
              status: 'sent',
              provider_message_id: out.id ?? messageId,
              sent_at: new Date().toISOString(),
            })
            return Response.json({ success: true, recipient, messageId: out.id ?? messageId, provider: 'resend' })
          } catch (e) {
            console.error('send-preview: resend request failed', e)
            await updateLog(logClient, logId, { status: 'failed', error_message: 'Resend request failed' })
            return Response.json({ error: 'Kunde inte skicka previewmailet via Resend' }, { status: 500 })
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

        return Response.json({ success: true, recipient, messageId })
      },
    },
  },
})
