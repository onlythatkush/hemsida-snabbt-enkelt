import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import postgres from 'postgres'
import { preflight, withCors } from '@/lib/cors'
import { hubDatabaseUrl } from '@/lib/hub/db'

/** Server-authoritative reference. The browser never invents one. */
function generateReference(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const bytes = new Uint8Array(6)
  crypto.getRandomValues(bytes)
  let out = ''
  for (const b of bytes) out += alphabet[b % alphabet.length]
  return `ORD-${out}`
}

/** Use the existing server-only Supabase credentials when the Postgres pool URL is unavailable. */
function supabaseRest() {
  const base = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!base || !key) return null
  return { base: base.replace(/\/$/, ''), key }
}
async function restRequest(path: string, init: RequestInit) {
  const cfg = supabaseRest()
  if (!cfg) throw new Error('Supabase REST credentials missing')
  const response = await fetch(cfg.base + '/rest/v1/' + path, {
    ...init,
    headers: { apikey: cfg.key, Authorization: 'Bearer ' + cfg.key, 'Content-Type': 'application/json', ...(init.headers || {}) },
  })
  if (!response.ok) {
    console.error('Supabase REST request failed', { status: response.status, path: path.split('?')[0] })
    throw new Error('Supabase REST status ' + response.status)
  }
  return response
}

const schema = z.object({
  // Optional and ignored for new submissions; kept so older clients still work.
  reference: z.string().trim().min(4).max(40).optional(),
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().min(4).max(60),
  company: z.string().trim().min(1).max(200),
  address: z.string().trim().max(200).optional().or(z.literal('')),
  description: z.string().trim().min(10).max(4000),
  socialLinks: z.string().trim().max(1000).optional().or(z.literal('')),
  websiteType: z.string().trim().min(1).max(80),
  colors: z.string().trim().max(300).optional().or(z.literal('')),
  extraRequests: z.string().trim().max(4000).optional().or(z.literal('')),
  wantsSupport: z.boolean().default(false),
  fileNames: z.array(z.string().trim().max(255)).max(10).default([]),
})

export const Route = createFileRoute('/api/public/application')({
  server: {
    handlers: {
      OPTIONS: async ({ request }) => preflight(request),
      GET: async ({ request }) => withCors(request, await handleGet(request)),
      POST: async ({ request }) => withCors(request, await handlePost(request)),
    },
  },
})

async function handlePost(request: Request): Promise<Response> {
  {
    {
      {
        let parsed: z.infer<typeof schema>
        try {
          parsed = schema.parse(await request.json())
        } catch {
          return Response.json({ error: 'Invalid input' }, { status: 400 })
        }

        const databaseUrl = hubDatabaseUrl()
        const reference = generateReference()
        if (!databaseUrl && !supabaseRest()) {
          return Response.json({ error: 'Database not configured' }, { status: 500 })
        }
        const record = {
          reference, name: parsed.name, email: parsed.email, phone: parsed.phone,
          company: parsed.company, address: parsed.address || null,
          description: parsed.description, social_links: parsed.socialLinks || null,
          website_type: parsed.websiteType, colors: parsed.colors || null,
          extra_requests: parsed.extraRequests || null, wants_support: parsed.wantsSupport,
          file_names: [], status: 'new', updated_at: new Date().toISOString(),
        }
        try {
          if (databaseUrl) {
            const db = postgres(databaseUrl, { max: 1, prepare: false })
            try {
              await db`INSERT INTO public.project_applications ${db(record)}`
            } finally { await db.end() }
          } else {
            await restRequest('project_applications', { method: 'POST', headers: { Prefer: 'return=minimal' }, body: JSON.stringify(record) })
          }
        } catch (error) {
          console.error('Failed to save application', error)
          return Response.json({ error: 'Ansökan kunde inte sparas. Ingen beställning har bekräftats.' }, { status: 500 })
        }

        // Build a first design from the submitted customer brief.
        let previewUrl: string | null = null
        let qaSendable = false
        try {
          const { composeDesignSpec } = await import('@/lib/design/compose')
          const spec = composeDesignSpec({
            reference, company: parsed.company, description: parsed.description,
            website_type: parsed.websiteType, colors: parsed.colors || '',
            extra_requests: parsed.extraRequests || '', social_links: parsed.socialLinks || '',
            address: parsed.address || '', email: parsed.email, phone: parsed.phone,
            file_names: [],
          })
          const { previewSendGate } = await import('@/lib/design/quality')
          const gate = previewSendGate(spec.qa, false)
          if (!gate.sendable) {
            console.warn('Preview withheld by QA', { reference, status: spec.qa.status, reason: gate.reason })
          }
          qaSendable = gate.sendable
          const token = crypto.randomUUID().replaceAll('-', '') + crypto.randomUUID().replaceAll('-', '')
          previewUrl = new URL('/kund-preview/' + encodeURIComponent(reference), request.url).toString() + '?token=' + token
          if (databaseUrl) {
            const previewDb = postgres(databaseUrl, { max: 1, prepare: false })
            try {
              await previewDb`ALTER TABLE public.project_applications ADD COLUMN IF NOT EXISTS preview_token TEXT`
              await previewDb`ALTER TABLE public.project_applications ADD COLUMN IF NOT EXISTS design_spec JSONB`
              await previewDb`ALTER TABLE public.project_applications ADD COLUMN IF NOT EXISTS design_family TEXT`
              await previewDb`UPDATE public.project_applications SET preview_token = ${token}, preview_url = ${previewUrl}, design_spec = ${previewDb.json(spec as any)}, design_family = ${spec.family}, status = 'preview' WHERE reference = ${reference}`
            } finally { await previewDb.end() }
          } else {
            await restRequest('project_applications?reference=eq.' + encodeURIComponent(reference), {
              method: 'PATCH', headers: { Prefer: 'return=minimal' },
              body: JSON.stringify({ preview_token: token, preview_url: previewUrl, design_spec: spec, design_family: spec.family, status: 'preview' }),
            })
          }
        } catch (error) {
          console.error('Preview generation failed', error)
          previewUrl = null
        }
        // A successful application must deliver its generated preview, not only save it.
        // Keep failures visible to the browser and logs; never claim the email was sent otherwise.
        let emailSent = false
        let emailError: string | null = null
        if (previewUrl && qaSendable) {
          try {
            const { renderTemplate } = await import('@/lib/hub/mail')
            const { replyAddressFor } = await import('@/lib/email/reply-address')
            const apiKey = process.env.RESEND_API_KEY
            if (!apiKey) throw new Error('RESEND_API_KEY missing')
            const mail = await renderTemplate('preview-ready', {
              name: parsed.name,
              company: parsed.company,
              previewUrl,
              reference,
            })
            const response = await fetch('https://api.resend.com/emails', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
              body: JSON.stringify({
                from: 'Din Webbpartner <preview@dinwebbpartner.com>',
                to: [parsed.email],
                reply_to: replyAddressFor(reference),
                subject: mail.subject,
                html: mail.html,
                text: mail.text,
              }),
            })
            if (!response.ok) throw new Error(`Resend ${response.status}: ${(await response.text()).slice(0, 200)}`)
            emailSent = true
          } catch (error) {
            emailError = String((error as Error)?.message || error).slice(0, 200)
            console.error('Automatic preview email failed', { reference, error: emailError })
          }
        }
        return Response.json({ success: true, reference, previewUrl, emailSent, emailError, qaSendable })
      }
    }
  }
}

/** Public existence check so the confirmation page can verify a reference. */
async function handleGet(request: Request): Promise<Response> {
  const reference = new URL(request.url).searchParams.get('reference')?.trim() || ''
  if (!reference || reference.length > 40 || !/^[A-Za-z0-9-]+$/.test(reference)) {
    return Response.json({ error: 'Invalid reference' }, { status: 400 })
  }

  const databaseUrl = hubDatabaseUrl()
  if (!databaseUrl && !supabaseRest()) return Response.json({ error: 'Database not configured' }, { status: 500 })
  try {
    if (!databaseUrl) {
      const response = await restRequest('project_applications?select=reference&reference=eq.' + encodeURIComponent(reference) + '&limit=1', { method: 'GET' })
      const rows = await response.json() as Array<{ reference: string }>
      return Response.json({ exists: rows.length > 0, reference })
    }
    const sql = postgres(databaseUrl, { max: 1, prepare: false })
    try {
      const rows = await sql<{ reference: string }[]>`SELECT reference FROM public.project_applications WHERE reference = ${reference} LIMIT 1`
      return Response.json({ exists: rows.length > 0, reference })
    } finally { await sql.end() }
  } catch (error) {
    console.error('Failed to verify application', error)
    return Response.json({ error: 'Lookup failed' }, { status: 500 })
  }
}
