import * as React from 'react'
import { render } from '@react-email/components'
import { createClient } from '@supabase/supabase-js'
import { createFileRoute } from '@tanstack/react-router'
import postgres from 'postgres'
import { z } from 'zod'
import { TEMPLATES } from '@/lib/email-templates/registry'

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

export const Route = createFileRoute('/api/admin/send-preview')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!authorized(request)) return Response.json({ error: 'Unauthorized' }, { status: 401 })

        let input
        try { input = schema.parse(await request.json()) }
        catch { return Response.json({ error: 'Invalid input' }, { status: 400 }) }

        const reference = input.reference.toUpperCase()

        // Load the application (prefer the same Postgres connection the rest of admin uses).
        let app: { reference: string; company?: string; name?: string; email?: string; preview_url?: string } | null = null
        const dbUrl = databaseUrl()
        if (dbUrl) {
          const sql = postgres(dbUrl, { max: 1, prepare: false })
          try {
            const rows = await sql`
              SELECT reference, company, name, email, preview_url
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
            .select('reference, company, name, email, preview_url')
            .eq('reference', reference)
            .maybeSingle()
          app = (data as any) || null
        }

        if (!app) return Response.json({ error: 'Ansökan hittades inte' }, { status: 404 })
        if (!app.preview_url) {
          return Response.json({ error: 'Ingen preview-länk finns för den här ansökan' }, { status: 400 })
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
        if (!provider.ok) {
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
        if (resendKey) {
          const from = process.env.RESEND_FROM || 'Din Webbpartner <onboarding@resend.dev>'
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
              return Response.json({ error: `Resend: ${res.status} ${body}` }, { status: 502 })
            }
            const out = (await res.json()) as { id?: string }
            return Response.json({ success: true, recipient, messageId: out.id ?? messageId, provider: 'resend' })
          } catch (e) {
            console.error('send-preview: resend request failed', e)
            return Response.json({ error: 'Kunde inte skicka previewmailet via Resend' }, { status: 500 })
          }
        }

        try {
          await provider.client.from('email_send_log').insert({
            message_id: messageId,
            template_name: 'preview-ready',
            recipient_email: recipient,
            status: 'pending',
          })

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
              queued_at: new Date().toISOString(),
            },
          })
          if (error) throw error
        } catch (e) {
          console.error('send-preview: enqueue failed', e)
          return Response.json({ error: 'Kunde inte skicka previewmailet' }, { status: 500 })
        }

        return Response.json({ success: true, recipient, messageId })
      },
    },
  },
})
