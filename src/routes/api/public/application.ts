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
          console.error('Failed to save application')
          return Response.json({
            error: 'Ansökan kunde inte sparas. Försök igen senare; ingen beställning har bekräftats.',
          }, { status: 500 })
        } finally {
          await sql2.end()
        }

        // Build a first design from the submitted customer brief.
        let previewUrl: string | null = null
        try {
          const { composeDesignSpec } = await import('@/lib/design/compose')
          const spec = composeDesignSpec({
            reference, company: parsed.company, description: parsed.description,
            website_type: parsed.websiteType, colors: parsed.colors || '',
            extra_requests: parsed.extraRequests || '', social_links: parsed.socialLinks || '',
            address: parsed.address || '', email: parsed.email, phone: parsed.phone,
            file_names: [],
          })
          const token = crypto.randomUUID().replaceAll('-', '') + crypto.randomUUID().replaceAll('-', '')
          previewUrl = new URL('/kund-preview/' + encodeURIComponent(reference), request.url).toString() + '?token=' + token
          const previewDb = postgres(databaseUrl, { max: 1, prepare: false })
          try {
            await previewDb`ALTER TABLE public.project_applications ADD COLUMN IF NOT EXISTS preview_token TEXT`
            await previewDb`ALTER TABLE public.project_applications ADD COLUMN IF NOT EXISTS design_spec JSONB`
            await previewDb`ALTER TABLE public.project_applications ADD COLUMN IF NOT EXISTS design_family TEXT`
            await previewDb`UPDATE public.project_applications SET preview_token = ${token}, preview_url = ${previewUrl}, design_spec = ${previewDb.json(spec as any)}, design_family = ${spec.family}, status = 'preview' WHERE reference = ${reference}`
          } finally {
            await previewDb.end()
          }
        } catch (error) {
          console.error('Preview generation failed', error)
          previewUrl = null
        }
        // A successful application must deliver its generated preview, not only save it.
        // Keep failures visible to the browser and logs; never claim the email was sent otherwise.
        let emailSent = false
        let emailError: string | null = null
        if (previewUrl) {
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
        return Response.json({ success: true, reference, previewUrl, emailSent, emailError })
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
