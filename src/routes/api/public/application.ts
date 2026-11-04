import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { preflight, withCors } from '@/lib/cors'
import { classifyDbError, hubSql, hubStore, logEvent } from '@/lib/hub/db'
import { DESIGN_SPEC_VERSION, composeDesignSpec } from '@/lib/design/compose'
import { recordDesignVersion } from '@/lib/hub/versions'
import { sendHubEmail } from '@/lib/hub/mail'

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

        if (hubStore() === 'none') {
          return Response.json({
            error: 'Ansökan kunde inte sparas. Servern saknar databaskonfiguration; ingen beställning har bekräftats.',
          }, { status: 503 })
        }

        const sql = hubSql()
        try {
          if (!(sql as any).__cloud) await sql`
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
        const sql2 = hubSql()
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
          console.error('Failed to save application', classifyDbError(error).kind, (error as any)?.code)
          await sql2.end()
          return Response.json({
            error: 'Ansökan kunde inte sparas. Försök igen senare; ingen beställning har bekräftats.',
          }, { status: 500 })
        }
        await logEvent(sql2, reference, 'application_received', 'Ansökan mottagen', { store: hubStore() })

        // Reuse the existing admin/revision design engine for the first preview.
        // A generation or email failure must never undo a successfully saved order.
        let previewGenerated = false
        let previewSent = false
        try {
          const revision = 1
          const spec = composeDesignSpec({
            reference,
            company: parsed.company,
            description: parsed.description,
            website_type: parsed.websiteType,
            colors: parsed.colors,
            extra_requests: parsed.extraRequests,
            social_links: parsed.socialLinks,
            address: parsed.address,
            email: parsed.email,
            phone: parsed.phone,
            file_names: [],
          }, { revision })
          const token = crypto.randomUUID().replaceAll('-', '') + crypto.randomUUID().replaceAll('-', '')
          const origin = new URL(request.url).origin
          const previewUrl = origin + '/kund-preview/' + encodeURIComponent(reference)
            + '?token=' + token + '&v=1-' + Date.now().toString(36)
          const qa = spec.qa

          await sql2`
            UPDATE public.project_applications
            SET preview_token=${token}, preview_url=${previewUrl},
                design_spec=${sql2.json(spec as any)}, design_family=${spec.family},
                design_revision=${revision}, qa_status=${qa?.status ?? null},
                qa_score=${qa?.score ?? null},
                qa_report=${qa ? sql2.json({ ...qa, designVersion: DESIGN_SPEC_VERSION, revision } as any) : null},
                qa_accepted_at=NULL, status='preview', updated_at=now()
            WHERE reference=${reference}
          `
          await recordDesignVersion(sql2, {
            reference, revision, designSpec: spec, designFamily: spec.family,
            designVersion: DESIGN_SPEC_VERSION, previewUrl,
            qaStatus: qa?.status ?? null, qaScore: qa?.score ?? null,
            qaReport: qa ? { ...qa, designVersion: DESIGN_SPEC_VERSION, revision } : null,
            source: 'admin',
          })
          previewGenerated = true
          await logEvent(sql2, reference, 'revision_generated', 'Första hemsideförslaget skapat automatiskt', {
            revision, family: spec.family, qaStatus: qa?.status, qaScore: qa?.score,
          })

          // Preserve the existing QA gate: only a ready design is sent automatically.
          if (qa?.status === 'ready') {
            const sent = await sendHubEmail(sql2, {
              reference, kind: 'preview_ready', templateKey: 'preview-ready',
              data: { name: parsed.name, company: parsed.company, previewUrl, reference },
              recipient: parsed.email, company: parsed.company, previewUrl, revision,
              idempotencyKey: `preview-${reference}-r1`,
            })
            previewSent = sent.sent || sent.duplicate === true
            if (!previewSent) {
              await logEvent(sql2, reference, 'preview_send_pending', 'Förhandsgranskning väntar på utskick', {
                revision, reason: sent.reason,
              })
            }
          } else {
            await logEvent(sql2, reference, 'preview_needs_admin', 'Förhandsgranskning kräver kvalitetsgranskning', {
              revision, qaStatus: qa?.status, qaScore: qa?.score,
            })
          }
        } catch (error) {
          console.error('Initial preview generation failed', reference, error)
          await logEvent(sql2, reference, 'preview_generation_failed', 'Automatisk förhandsgranskning misslyckades', {
            error: String((error as Error)?.message || error).slice(0, 200),
          })
        }
        await sql2.end()

        return Response.json({ success: true, reference, previewGenerated, previewSent })
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

  if (hubStore() === 'none') {
    return Response.json({ error: 'Database not configured' }, { status: 503 })
  }

  const sql = hubSql()
  try {
    const rows = await sql<{ reference: string }[]>`
      SELECT reference FROM public.project_applications WHERE reference = ${reference} LIMIT 1
    `
    return Response.json({ exists: rows.length > 0, reference })
  } catch (error) {
    console.error('Failed to verify application', classifyDbError(error).kind)
    return Response.json({ error: 'Lookup failed' }, { status: 500 })
  } finally {
    await sql.end()
  }
}

