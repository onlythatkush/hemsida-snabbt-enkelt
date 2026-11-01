import { createClient } from '@supabase/supabase-js'
import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import postgres from 'postgres'
import { preflight, withCors } from '@/lib/cors'

/** Server-authoritative reference. The browser never invents one. */
function generateReference(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const bytes = new Uint8Array(6)
  crypto.getRandomValues(bytes)
  let out = ''
  for (const b of bytes) out += alphabet[b % alphabet.length]
  return `ORD-${out}`
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


const NOTIFICATION_EMAIL = 'Kushtrim.x@hotmail.se'
const SENDER_EMAIL = 'Din Webbpartner <bekraftelse@dinwebbpartner.com>'

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[char] || char)
}

async function sendApplicationEmail(
  to: string,
  subject: string,
  html: string,
  idempotencyKey: string,
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) throw new Error('RESEND_API_KEY missing')
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'Idempotency-Key': idempotencyKey,
    },
    body: JSON.stringify({ from: SENDER_EMAIL, to: [to], subject, html }),
  })
  if (!response.ok) {
    const detail = await response.text()
    throw new Error(`Resend HTTP ${response.status}: ${detail.slice(0, 500)}`)
  }
}

async function notifyApplication(
  application: z.infer<typeof schema>,
  reference: string,
): Promise<{ customer: boolean; owner: boolean }> {
  const ref = escapeHtml(reference)
  const company = escapeHtml(application.company)
  const name = escapeHtml(application.name)
  const customerHtml = `<p>Hej ${name}!</p><p>Tack för din ansökan hos Din Webbpartner. Vi har tagit emot din förfrågan och återkommer så snart vi har gått igenom den.</p><p><strong>Ärendenummer: ${ref}</strong></p><p>Vänliga hälsningar,<br>Din Webbpartner</p>`
  const ownerHtml = `<p>En ny ansökan har kommit in.</p><p><strong>Ärendenummer:</strong> ${ref}<br><strong>Företag:</strong> ${company}<br><strong>Kontaktperson:</strong> ${name}</p><p>Logga in i administrationspanelen för att se hela ansökan.</p>`
  const results = await Promise.allSettled([
    sendApplicationEmail(application.email, `Vi har fått din ansökan – ${reference}`, customerHtml, `application-${reference}-customer`),
    sendApplicationEmail(NOTIFICATION_EMAIL, `Ny ansökan: ${application.company} (${reference})`, ownerHtml, `application-${reference}-owner`),
  ])
  for (const [index, result] of results.entries()) {
    if (result.status === 'rejected') {
      console.error('Application email delivery failed', {
        reference, recipientType: index === 0 ? 'customer' : 'owner',
        error: result.reason instanceof Error ? result.reason.message : String(result.reason),
      })
    }
  }
  return { customer: results[0].status === 'fulfilled', owner: results[1].status === 'fulfilled' }
}

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
        const supabaseUrl =
          import.meta.env.VITE_SUPABASE_URL ||
          import.meta.env.VITE_STORAGE_URL ||
          process.env.SUPABASE_URL ||
          process.env.STORAGE_URL
        const serviceKey =
          process.env.SUPABASE_SERVICE_ROLE_KEY ||
          process.env.SUPABASE_SECRET_KEY ||
          process.env.STORAGE_SERVICE_ROLE_KEY ||
          process.env.STORAGE_SECRET_KEY
        if (!supabaseUrl || !serviceKey) {
          return Response.json({
            error: 'Server misconfigured',
            missing: {
              supabaseUrl: !supabaseUrl,
              serviceKey: !serviceKey,
            },
          }, { status: 500 })
        }

        let parsed: z.infer<typeof schema>
        try {
          parsed = schema.parse(await request.json())
        } catch {
          return Response.json({ error: 'Invalid input' }, { status: 400 })
        }

        const databaseUrl =
          process.env.POSTGRES_URL ||
          process.env.STORAGE_POSTGRES_URL ||
          process.env.STORAGE_DATABASE_URL ||
          process.env.DATABASE_URL || process.env.SUPABASE_DB_URL
        if (!databaseUrl) {
          return Response.json({
            error: 'Database not configured',
            hint: 'Missing POSTGRES_URL / STORAGE_POSTGRES_URL / STORAGE_DATABASE_URL / DATABASE_URL',
          }, { status: 500 })
        }

        const sql = postgres(databaseUrl, { max: 1, prepare: false })
        try {
          await sql`
            CREATE TABLE IF NOT EXISTS public.project_applications (
              id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
              reference TEXT NOT NULL UNIQUE,
              name TEXT NOT NULL,
              email TEXT NOT NULL,
              phone TEXT NOT NULL,
              company TEXT NOT NULL,
              address TEXT,
              description TEXT NOT NULL,
              social_links TEXT,
              website_type TEXT NOT NULL,
              colors TEXT,
              extra_requests TEXT,
              wants_support BOOLEAN NOT NULL DEFAULT false,
              file_names TEXT[] NOT NULL DEFAULT '{}',
              status TEXT NOT NULL DEFAULT 'new',
              preview_url TEXT,
              created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
              updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
            )
          `
        } catch {
          // Table already exists and is owned by another role - fine.
        } finally {
          await sql.end()
        }

        const reference = generateReference()
        const sql2 = postgres(databaseUrl, { max: 1, prepare: false })
        try {
          await sql2`
            INSERT INTO public.project_applications (
              reference, name, email, phone, company, address, description,
              social_links, website_type, colors, extra_requests, wants_support,
              file_names, status, updated_at
            ) VALUES (
              ${reference},
              ${parsed.name},
              ${parsed.email},
              ${parsed.phone},
              ${parsed.company},
              ${parsed.address || null},
              ${parsed.description},
              ${parsed.socialLinks || null},
              ${parsed.websiteType},
              ${parsed.colors || null},
              ${parsed.extraRequests || null},
              ${parsed.wantsSupport},
              ${[]},
              'new',
              now()
            )
            ON CONFLICT (reference) DO UPDATE SET
              name = EXCLUDED.name,
              email = EXCLUDED.email,
              phone = EXCLUDED.phone,
              company = EXCLUDED.company,
              address = EXCLUDED.address,
              description = EXCLUDED.description,
              social_links = EXCLUDED.social_links,
              website_type = EXCLUDED.website_type,
              colors = EXCLUDED.colors,
              extra_requests = EXCLUDED.extra_requests,
              wants_support = EXCLUDED.wants_support,
              updated_at = now()
          `
        } catch (error) {
          console.error('Failed to save application', error)
          return Response.json({
            error: 'Failed to save application',
            detail: error instanceof Error ? error.message : String(error),
          }, { status: 500 })
        } finally {
          await sql2.end()
        }

        const email = await notifyApplication(parsed, reference)
        return Response.json({ success: true, reference, email })
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

  const databaseUrl =
    process.env.POSTGRES_URL ||
    process.env.STORAGE_POSTGRES_URL ||
    process.env.STORAGE_DATABASE_URL ||
    process.env.DATABASE_URL ||
    process.env.SUPABASE_DB_URL
  if (!databaseUrl) {
    return Response.json({ error: 'Database not configured' }, { status: 500 })
  }

  const sql = postgres(databaseUrl, { max: 1, prepare: false })
  try {
    const rows = await sql<{ reference: string }[]>`
      SELECT reference FROM public.project_applications WHERE reference = ${reference} LIMIT 1
    `
    return Response.json({ exists: rows.length > 0, reference })
  } catch (error) {
    console.error('Failed to verify application', error)
    return Response.json({ error: 'Lookup failed' }, { status: 500 })
  } finally {
    await sql.end()
  }
}
