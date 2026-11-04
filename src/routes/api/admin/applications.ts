import { lovableDemos } from '@/lib/lovable/customer-demos'
import { createClient } from '@supabase/supabase-js'
import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { DESIGN_SPEC_VERSION, composeDesignSpec } from '@/lib/design/compose'
import { hubSql, hubStore, hubStoreMissingMessage, withHubRead } from '@/lib/hub/db'
import { listApplications } from '@/lib/hub/applications'
import { listVersions, nextRevision, recordDesignVersion } from '@/lib/hub/versions'

const createPreviewSchema = z.object({
  reference: z.string().min(4).max(40),
  action: z.enum(['create-preview', 'regenerate-design', 'lovable-demo', 'ai-adjust']),
  changeRequest: z.string().max(2000).optional(),
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

          if (timeline) {
            if (!/^[A-Z0-9-]{4,40}$/.test(timeline)) {
              return Response.json({ error: 'Invalid reference' }, { status: 400 })
            }
            // Read over the unified hub connection — the same database the
            // writes use — so the timeline can never report a "missing" table.
            try {
              const data = await withHubRead(async (sql) => {
                const [events, changeRequests, versions, jobs] = await Promise.all([
                  sql`SELECT * FROM public.application_events WHERE reference = ${timeline} ORDER BY created_at DESC LIMIT 80`,
                  sql`SELECT * FROM public.customer_change_requests WHERE reference = ${timeline} ORDER BY received_at DESC LIMIT 30`,
                  listVersions(sql, timeline),
                  sql`SELECT id, status, revision, retry_count, last_error, created_at, finished_at FROM public.revision_jobs WHERE reference = ${timeline} ORDER BY created_at DESC LIMIT 20`,
                ])
                return { events, changeRequests, versions, jobs }
              })
              return Response.json(data)
            } catch (e) {
              console.error('applications: timeline read failed', e)
              return Response.json({ error: 'Historiken kunde inte hämtas. Kontrollera databasanslutning och schema.' }, { status: 503 })
            }
          }


          if (file) {
            if (!file.startsWith('ORD-') || file.includes('..')) {
              return Response.json({ error: 'Invalid file path' }, { status: 400 })
            }
            const { data, error } = await client().storage
              .from('project-files')
              .createSignedUrl(file, 60 * 5)
            if (error || !data?.signedUrl) {
              return Response.json({ error: 'Failed to open file' }, { status: 404 })
            }
            return Response.json({ url: data.signedUrl })
          }

          const applications = await withHubRead(listApplications)
          return Response.json({ applications, store: hubStore() }, { headers: { 'cache-control': 'no-store' } })
        } catch (error) {
          console.error(error)
          return Response.json({ error: 'Ansökningarna kunde inte hämtas. Kontrollera orderdatabasens anslutning (POSTGRES_URL/HUB_STORE) i serverns driftmiljö; detta är inte en tom orderlista.' }, { status: 503 })
        }
      },
      POST: async ({ request }) => {
        if (!authorized(request)) return Response.json({ error: 'Unauthorized' }, { status: 401 })
        let input
        try { input = createPreviewSchema.parse(await request.json()) }
        catch { return Response.json({ error: 'Invalid input' }, { status: 400 }) }

        if (hubStore() === 'none') return Response.json({ error: hubStoreMissingMessage() }, { status: 503 })

        const origin = new URL(request.url).origin
        const sql = hubSql()
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
            await sql`ALTER TABLE public.project_applications ADD COLUMN IF NOT EXISTS design_revision INTEGER`
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
          const previousRevision = Math.max(
            Number(app.design_spec?.revision) || 0,
            Number(app.design_revision) || 0,
          )
          // Derived from the immutable history first so a revision number is never reused.
          const revision = await nextRevision(sql, app.reference, previousRevision).catch(() => previousRevision + 1)

          if (input.action === 'ai-adjust') {
            const wish = (input.changeRequest || '').trim().toLowerCase()
            if (!wish || !/(ljus|mörk|bright|light|dark)/i.test(wish)) {
              return Response.json({ error: 'Vår AI kan ännu bara göra säkra justeringar av ljus och mörka toner. Skicka andra önskemål till granskning.' }, { status: 422 })
            }
            if (!app.design_spec || !app.preview_url) return Response.json({ error: 'Ingen befintlig design att justera' }, { status: 409 })
            const brighten = /ljusare|ljus|för mörk|mindre mörk|bright|lighter/i.test(wish)
            const darken = /mörkare|darken|darker/i.test(wish) && !brighten
            if (!brighten && !darken) return Response.json({ error: 'Ändringsönskemålet behöver granskas manuellt' }, { status: 422 })
            const spec = structuredClone(app.design_spec)
            const oldOverlay = Number(spec.motif?.overlay ?? 0.48)
            spec.motif = { ...(spec.motif || {}), overlay: brighten ? Math.max(0.12, oldOverlay - 0.22) : Math.min(0.78, oldOverlay + 0.15) }
            spec.palette = { ...(spec.palette || {}), mode: brighten ? 'light' : 'dark' }
            if (brighten) Object.assign(spec.palette, { bg: '#f6f8fc', surface: '#ffffff', surfaceAlt: '#edf2f9', ink: '#17243b', muted: '#52627a', border: '#d9e2ee' })
            spec.revision = revision
            spec.generatedAt = new Date().toISOString()
            // An automatic style edit is not a verified visual QA pass.
            spec.qa = { ...(spec.qa || {}), status: 'review', score: null, checks: [{ id: 'visual-review', label: 'Kontrollera ljusstyrka, bildkontrast och mobilvy före kundutskick', level: 'warn' }] }
            const token = app.preview_token && String(app.preview_token).length >= 32 ? String(app.preview_token) : crypto.randomUUID().replaceAll('-', '') + crypto.randomUUID().replaceAll('-', '')
            const previewUrl = origin + '/kund-preview/' + encodeURIComponent(app.reference) + '?token=' + token + '&v=' + revision + '-' + Date.now().toString(36)
            await recordDesignVersion(sql, { reference: app.reference, revision, designSpec: spec, designFamily: spec.family, designVersion: DESIGN_SPEC_VERSION, previewUrl, qaStatus: 'review', qaScore: null, qaReport: spec.qa, source: 'admin' })
            const rows = await sql`UPDATE public.project_applications SET preview_token=${token}, preview_url=${previewUrl}, design_spec=${sql.json(spec as any)}, design_revision=${revision}, qa_status='review', qa_score=NULL, qa_report=${sql.json(spec.qa as any)}, qa_accepted_at=NULL, status='changes', updated_at=now() WHERE reference=${app.reference} RETURNING *`
            return Response.json({ application: rows[0], diagnostics: { revision, qaStatus: 'review', message: 'AI-justering skapad. Granska innan kundutskick.' } })
          }

          const demo = input.action === 'lovable-demo' ? lovableDemos[input.reference] : null
          if (input.action === 'lovable-demo' && !demo) return Response.json({ error: 'Ingen Lovable-demo för denna order' }, { status: 404 })
          const spec = composeDesignSpec(
            {
              reference: app.reference,
              company: app.company,
              description: app.description,
              website_type: app.website_type,
              colors: demo?.palette?.accent || app.colors,
              extra_requests: app.extra_requests,
              social_links: app.social_links,
              address: app.address,
              email: app.email,
              phone: app.phone,
              file_names: Array.isArray(app.file_names) ? app.file_names : [],
            },
            { revision, ...(input.family ? { family: input.family as any } : {}) },
          )

          if (demo) {
            // Customer-specific Lovable proposals must never inherit stock copy,
            // galleries, contact data or service lists from a generic industry template.
            spec.brand.company = demo.company.name
            spec.brand.tagline = demo.company.tagline
            spec.brand.heroTitle = demo.hero.headline
            spec.brand.heroSub = demo.hero.subheadline
            spec.brand.ctaPrimary = demo.hero.primaryCta === 'book' ? 'Boka däckbyte' : 'Ring oss'
            spec.brand.ctaSecondary = 'Ring ' + demo.customerFacts.phone.display
            spec.brand.phone = demo.customerFacts.phone.display
            spec.brand.address = demo.customerFacts.address.full
            spec.brand.email = demo.customerFacts.email || undefined
            spec.brand.socialLinks = undefined
            spec.palette.mode = demo.palette.mode
            spec.palette.primary = demo.palette.accent
            spec.palette.accent = demo.palette.accentGlow || demo.palette.accent
            spec.palette.bg = demo.palette.background
            spec.palette.surface = demo.palette.surface
            spec.palette.surfaceAlt = demo.palette.surface
            spec.palette.ink = demo.palette.foreground
            spec.palette.muted = demo.palette.mutedForeground
            spec.palette.border = demo.palette.border
            spec.palette.onPrimary = demo.palette.onAccent
            spec.palette.primarySoft = '#1b315c'
            spec.type.headingFamily = demo.typography.display.family
            spec.type.bodyFamily = demo.typography.body.family
            spec.type.headingCase = 'none'
            spec.fonts = [demo.typography.display.family, demo.typography.body.family]
            spec.motif = { ...spec.motif!, imageFilter: 'none', ctaStyle: 'pill', divider: 'hairline', overlay: 0.48 }
            spec.stockSet = undefined
            spec.art = { subjects: ['tires', 'rims', 'workshop'], keywords: [], mood: 'neutral', requireHeroMedia: true }
            const assetOrigin = new URL(demo.previewUrl).origin
            const assetImages = (demo.imagery || []).filter((image: any) =>
              typeof image.path === 'string' && image.path.startsWith('/dwp-assets/' + input.reference + '/')
            )
            spec.images = assetImages.map((image: any, index: number) => ({
              path: image.path, name: image.key,
              role: index === 0 ? 'hero' as const : 'feature' as const,
              url: assetOrigin + image.path,
            }))
            const imageIndex = (key: string) => Math.max(0, assetImages.findIndex((image: any) => image.key === key))
            spec.sections = [
              { id: 'hero', type: 'hero', eyebrow: demo.hero.eyebrow, images: [imageIndex('hero')] },
              ...demo.sections.filter((section: any) => section.items?.length).map((section: any) => ({
                id: section.id, type: 'services' as const, eyebrow: section.eyebrow,
                title: section.title, tone: 'base' as const,
                items: section.items.map((item: any) => ({ title: item.title, body: item.text })),
                images: section.items.map((item: any) => imageIndex(item.image)),
              })),
              ...demo.sections.filter((section: any) => section.id === 'cta-band').map((section: any) => ({
                id: 'cta-band', type: 'local' as const, eyebrow: 'Kontakta oss',
                title: section.title, body: section.text, tone: 'base' as const,
              })),
              ...demo.sections.filter((section: any) => section.id === 'contact').map((section: any) => ({
                id: 'contact', type: 'contact' as const, eyebrow: section.eyebrow,
                title: section.title, body: section.text, tone: 'contrast' as const,
              })),
            ]
            spec.engine = { ...spec.engine!, heroSource: 'customer', heroAsset: 'hero.jpg', stockSet: undefined }
          }
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
                design_revision = ${revision},
                qa_status = ${qa?.status ?? null},
                qa_score = ${qa?.score ?? null},
                qa_report = ${qa ? sql.json({ ...qa, designVersion: DESIGN_SPEC_VERSION, revision } as any) : null},
                qa_accepted_at = NULL,
                status = 'preview',
                updated_at = now()
            WHERE reference = ${input.reference}
            RETURNING *
          `
          await recordDesignVersion(sql, {
            reference: app.reference,
            revision,
            designSpec: spec,
            designFamily: spec.family,
            designVersion: DESIGN_SPEC_VERSION,
            previewUrl: versionedPreviewUrl,
            qaStatus: qa?.status ?? null,
            qaScore: qa?.score ?? null,
            qaReport: qa ? { ...qa, designVersion: DESIGN_SPEC_VERSION, revision } : null,
            source: 'admin',
          }).catch((e) => console.error('applications: version history insert failed', e))

          await sql`
            INSERT INTO public.application_events (reference, event_type, label, details)
            VALUES (${input.reference}, 'revision_generated', ${'Ny version ' + revision + ' skapad i admin'},
                    ${sql.json({ revision, family: spec.family, qaStatus: qa?.status, qaScore: qa?.score } as any)})
          `.catch(() => undefined)

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


        let sql
        try {
          sql = hubSql()
          const rows = await sql`UPDATE public.project_applications SET ${sql(patch)} WHERE reference = ${input.reference} RETURNING *`
          if (!rows[0]) return Response.json({ error: 'Ansökan hittades inte' }, { status: 404 })
          return Response.json({ application: rows[0] })
        } catch {
          return Response.json({ error: 'Kunde inte uppdatera ansökan i orderdatabasen' }, { status: 503 })
        } finally {
          await sql?.end({ timeout: 5 }).catch(() => undefined)
        }
      },
    },
  },
})
