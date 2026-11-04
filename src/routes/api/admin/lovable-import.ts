import { createClient } from '@supabase/supabase-js'
import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { hubSql, hubStore, hubStoreMissingMessage } from '@/lib/hub/db'

const schema = z.object({
  reference: z.string().regex(/^ORD-[A-Z0-9]{4,20}$/),
  lovableProjectId: z.string().uuid(),
  lovableCommit: z.string().regex(/^[a-f0-9]{40}$/),
  previewUrl: z.string().url().max(500),
  designBrief: z.string().min(10).max(20000),
  designMetadata: z.record(z.string(), z.unknown()).default({}),
  files: z.array(z.object({ path: z.string().min(1).max(300), binary: z.boolean() })).max(500),
})

function authorized(request: Request) {
  const key = process.env.ADMIN_ACCESS_KEY
  return Boolean(key && request.headers.get('x-admin-key') === key)
}

export const Route = createFileRoute('/api/admin/lovable-import')({
  server: { handlers: {
    PUT: async ({ request }) => {
      if (!authorized(request)) return Response.json({ error: 'Unauthorized' }, { status: 401 })
      const data = await request.formData().catch(() => null)
      const reference = String(data?.get('reference') ?? '')
      const archive = data?.get('archive')
      if (!/^ORD-[A-Z0-9]{4,20}$/.test(reference) || !(archive instanceof File) ||
          !/\\.zip$/i.test(archive.name) || archive.size > 20 * 1024 * 1024 || archive.size === 0) {
        return Response.json({ error: 'Choose a ZIP archive up to 20 MB and a valid order' }, { status: 400 })
      }
      const url = process.env.SUPABASE_URL
      const key = process.env.SUPABASE_SERVICE_ROLE_KEY
      if (!url || !key) return Response.json({ error: 'Source archive storage is not configured' }, { status: 503 })
      const sql = hubSql()
      try {
        const existing = await sql`SELECT reference FROM public.project_applications WHERE reference=${reference} LIMIT 1`
        if (!existing.length) return Response.json({ error: 'Order not found' }, { status: 404 })
        const storage = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } }).storage
        const destination = reference + '/lovable-source-' + crypto.randomUUID() + '.zip'
        const uploaded = await storage.from('project-files').upload(destination, archive, {
          contentType: 'application/zip', upsert: false,
        })
        if (uploaded.error) return Response.json({ error: 'Storage upload failed: ' + uploaded.error.message }, { status: 503 })
        try {
          const updated = await sql`
            UPDATE public.lovable_project_imports SET source_import_status='source_archive_saved',
            updated_at=now(), design_metadata=design_metadata || ${sql.json({ sourceArchivePath: destination, sourceArchiveBytes: archive.size } as any)}
            WHERE reference=${reference} RETURNING reference
          `
          if (!updated.length) {
            await storage.from('project-files').remove([destination])
            return Response.json({ error: 'Save project metadata first' }, { status: 409 })
          }
        } catch (error) {
          await storage.from('project-files').remove([destination])
          throw error
        }
        return Response.json({ reference, status: 'source_archive_saved', note: 'ZIP stored privately; not built or published' })
      } catch (error) {
        console.error('lovable archive upload failed', error)
        return Response.json({ error: 'Could not store source archive in the authoritative order' }, { status: 503 })
      } finally { await sql.end().catch(() => undefined) }
    },
    POST: async ({ request }) => {
      if (!authorized(request)) return Response.json({ error: 'Unauthorized' }, { status: 401 })
      if (hubStore() === 'none') return Response.json({ error: hubStoreMissingMessage() }, { status: 503 })
      let input: z.infer<typeof schema>
      try { input = schema.parse(await request.json()) }
      catch { return Response.json({ error: 'Invalid import manifest' }, { status: 400 }) }
      const sql = hubSql()
      try {
        // An import manifest is NOT a copy of the website source. Never label it delivered.
        if (!(sql as any).__cloud) await sql`
          CREATE TABLE IF NOT EXISTS public.lovable_project_imports (
            reference TEXT PRIMARY KEY,
            lovable_project_id TEXT NOT NULL,
            lovable_commit TEXT NOT NULL,
            preview_url TEXT NOT NULL,
            design_brief TEXT NOT NULL,
            design_metadata JSONB NOT NULL,
            file_manifest JSONB NOT NULL,
            source_import_status TEXT NOT NULL DEFAULT 'awaiting_source_archive',
            created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
          )
        `
        const existing = await sql`SELECT reference FROM public.project_applications WHERE reference = ${input.reference} LIMIT 1`
        if (!existing.length) return Response.json({ error: 'Order not found in authoritative database' }, { status: 404 })
        const rows = await sql`
          INSERT INTO public.lovable_project_imports
          (reference, lovable_project_id, lovable_commit, preview_url, design_brief, design_metadata, file_manifest)
          VALUES (${input.reference}, ${input.lovableProjectId}, ${input.lovableCommit}, ${input.previewUrl},
                  ${input.designBrief}, ${sql.json(input.designMetadata as any)}, ${sql.json(input.files as any)})
          ON CONFLICT (reference) DO UPDATE SET
            lovable_project_id=EXCLUDED.lovable_project_id,
            lovable_commit=EXCLUDED.lovable_commit,
            preview_url=EXCLUDED.preview_url,
            design_brief=EXCLUDED.design_brief,
            design_metadata=EXCLUDED.design_metadata,
            file_manifest=EXCLUDED.file_manifest,
            updated_at=now()
          RETURNING reference, lovable_project_id, source_import_status, updated_at
        `
        return Response.json({ import: rows[0], note: 'Metadata saved; source archive still required. No publishing or emails.' })
      } catch (error) {
        console.error('lovable-import failed', error)
        return Response.json({ error: 'Import metadata could not be saved' }, { status: 503 })
      } finally { await sql.end().catch(() => undefined) }
    },
  } },
})
