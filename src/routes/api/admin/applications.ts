import { createClient } from '@supabase/supabase-js'
import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import postgres from 'postgres'
import { DESIGN_SPEC_VERSION, composeDesignSpec } from '@/lib/design/compose'

const createPreviewSchema = z.object({
  reference: z.string().min(4).max(40),
  action: z.enum(['create-preview', 'regenerate-design']),
  family: z.string().max(40).optional(),
})

const updateSchema = z.object({
  reference: z.string().min(4).max(40),
  status: z.enum(['new','reviewing','building','preview','changes','approved','paid','delivered','archived']).optional(),
  previewUrl: z.string().url().max(500).optional().or(z.literal('')),
  acceptQa: z.boolean().optional(),
})


function authorized(request: Request) {
  const expected = process.env.ADMIN_ACCESS_KEY
  const provided = request.headers.get('x-admin-key')
  return Boolean(expected && provided && provided === expected)
}

function client() {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY
  if (!supabaseUrl || !serviceKey) throw new Error('Server misconfigured')
  return createClient<any>(supabaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } })
}

export const Route = createFileRoute('/api/admin/applications')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        if (!authorized(request)) return Response.json({ error: 'Unauthorized' }, { status: 401 })
        try {
          const url = new URL(request.url)
          const file = url.searchParams.get('file')
          const timeline = url.searchParams.get('timeline')
          const supabase = client()

          if (timeline) {
            if (!/^[A-Z0-9-]{4,40}$/.test(timeline)) {
              return Response.json({ error: 'Invalid reference' }, { status: 400 })
            }
            const [events, requests] = await Promise.all([
              supabase
                .from('application_events')
                .select('id, event_type, label, details, created_at')
                .eq('reference', timeline)
                .order('created_at', { ascending: false })
                .limit(50),
              supabase
                .from('customer_change_requests')
                .select('id, raw_text, directives, status, revision, received_at, matched_via, error')
                .eq('reference', timeline)
                .order('received_at', { ascending: false })
                .limit(20),
            ])
            // Missing tables must never break the admin panel.
            return Response.json({
              events: events.error ? [] : events.data || [],
              changeRequests: requests.error ? [] : requests.data || [],
            })
          }

          if (file) {
            if (!file.startsWith('ORD-') || file.includes('..')) {
              return Response.json({ error: 'Invalid file path' }, { status: 400 })
            }
            const { data, error } = await supabase.storage
              .from('project-files')
              .createSignedUrl(file, 60 * 5)
            if (error || !data?.signedUrl) {
              return Response.json({ error: 'Failed to open file' }, { status: 404 })
            }
            return Response.json({ url: data.signedUrl })
          }

          const { data, error } = await supabase
            .from('project_applications')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(200)
          if (error) throw error
          return Response.json({ applications: data || [] })
        } catch (error) {
          console.error(error)
          return Response.json({ error: 'Failed to load applications' }, { status: 500 })
        }
      },
      POST: async ({ request }) => {
        if (!authorized(request)) return Response.json({ error: 'Unauthorized' }, { status: 401 })
        let input
        try { input = createPreviewSchema.parse(await request.json()) }
        catch { return Response.json({ error: 'Invalid input' }, { status: 400 }) }

        const databaseUrl = process.env.POSTGRES_URL || process.env.STORAGE_POSTGRES_URL || process.env.STORAGE_DATABASE_URL || process.env.DATABASE_URL || process.env.SUPABASE_DB_URL
        if (!databaseUrl) return Response.json({ error: 'Database not configured' }, { status: 500 })

        const origin = new URL(request.url).origin
        const sql = postgres(databaseUrl, { max: 1, prepare: false })
        try {
          try {
            await sql`ALTER TABLE public.project_applications ADD COLUMN IF NOT EXISTS preview_token TEXT`
            await sql`ALTER TABLE public.project_applications ADD COLUMN IF NOT EXISTS design_spec JSONB`
            await sql`ALTER TABLE public.project_applications ADD COLUMN IF NOT EXISTS design_family TEXT`
            await sql`ALTER TABLE public.project_applications ADD COLUMN IF NOT EXISTS design_locked BOOLEAN NOT NULL DEFAULT false`
            await sql`ALTER TABLE public.project_applications ADD COLUMN IF NOT EXISTS qa_status TEXT`
            await sql`ALTER TABLE public.project_applications ADD COLUMN IF NOT EXISTS qa_score INTEGER`
            await sql`ALTER TABLE public.project_applications ADD COLUMN IF NOT EXISTS qa_report JSONB`
            await sql`ALTER TABLE public.project_applications ADD COLUMN IF NOT EXISTS qa_accepted_at TIMESTAMPTZ`
          } catch { /* schema managed by migrations */ }


          const found = await sql`
            SELECT * FROM public.project_applications WHERE reference = ${input.reference} LIMIT 1
          `
          if (!found.length) return Response.json({ error: 'Application not found' }, { status: 404 })
          const app = found[0] as any

          if (input.action === 'regenerate-design' && app.design_locked) {
            return Response.json({ error: 'Designen är låst för denna kund' }, { status: 409 })
          }

          // IMPORTANT: regenerate must never silently reuse an old preview spec.
          // Always compose a fresh spec from the current customer application.
          // Every press of "Gör ny hemsida" is a new, deterministic revision of
          // the design — never a reuse of the previously stored spec.
          const previousRevision = Number(app.design_spec?.revision) || 0
          const revision = previousRevision + 1

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
            { revision, ...(input.family ? { family: input.family as any } : {}) },
          )

          const token: string =
            app.preview_token && String(app.preview_token).length >= 32
              ? String(app.preview_token)
              : crypto.randomUUID().replaceAll('-', '') + crypto.randomUUID().replaceAll('-', '')
          const previewUrl = origin + '/kund-preview/' + encodeURIComponent(input.reference) + '?token=' + token

          // Version the preview URL so Safari/CDNs cannot show a cached old render after regeneration.
          const previewRevision = `${revision}-${Date.now().toString(36)}`
          const versionedPreviewUrl = previewUrl + '&v=' + previewRevision

          // The QA gate runs automatically on every generation. A new design
          // always resets any previous admin acceptance.
          const qa = spec.qa
          const rows = await sql`
            UPDATE public.project_applications
            SET preview_token = ${token},
                preview_url = ${versionedPreviewUrl},
                design_spec = ${sql.json(spec as any)},
                design_family = ${spec.family},
                qa_status = ${qa?.status ?? null},
                qa_score = ${qa?.score ?? null},
                qa_report = ${qa ? sql.json({ ...qa, designVersion: DESIGN_SPEC_VERSION, revision } as any) : null},
                qa_accepted_at = NULL,
                status = 'preview',
                updated_at = now()
            WHERE reference = ${input.reference}
            RETURNING *
          `
          return Response.json({
            application: rows[0],
            diagnostics: {
              revision,
              designVersion: DESIGN_SPEC_VERSION,
              generatedAt: spec.generatedAt,
              family: spec.family,
              industry: spec.industry,
              heroSource: spec.engine?.heroSource,
              heroAsset: spec.engine?.heroAsset,
              stockSet: spec.stockSet,
              rejectedAssets: spec.engine?.rejectedAssets || [],
              qaScore: qa?.score,
              qaStatus: qa?.status,
              qaFailed: (qa?.checks || []).filter((c) => c.level === 'fail').map((c) => c.id),
              qaWarned: (qa?.checks || []).filter((c) => c.level === 'warn').map((c) => c.id),
            },
          })

        } catch (error) {
          console.error('Failed to create preview', error)
          return Response.json({ error: 'Failed to create preview' }, { status: 500 })
        } finally {
          await sql.end()
        }
      },
      PATCH: async ({ request }) => {
        if (!authorized(request)) return Response.json({ error: 'Unauthorized' }, { status: 401 })
        let input
        try { input = updateSchema.parse(await request.json()) }
        catch { return Response.json({ error: 'Invalid input' }, { status: 400 }) }

        const patch: Record<string, any> = { updated_at: new Date().toISOString() }
        if (input.status) patch.status = input.status
        if (input.previewUrl !== undefined) patch.preview_url = input.previewUrl || null
        if (input.acceptQa !== undefined) patch.qa_accepted_at = input.acceptQa ? new Date().toISOString() : null


        const { data, error } = await client()
          .from('project_applications')
          .update(patch)
          .eq('reference', input.reference)
          .select('*')
          .single()

        if (error) return Response.json({ error: 'Failed to update application' }, { status: 500 })
        return Response.json({ application: data })
      },
    },
  },
})
