import { createClient } from '@supabase/supabase-js'
import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import postgres from 'postgres'

const createPreviewSchema = z.object({
  reference: z.string().min(4).max(40),
  action: z.literal('create-preview'),
})

const updateSchema = z.object({
  reference: z.string().min(4).max(40),
  status: z.enum(['new','reviewing','building','preview','changes','approved','paid','delivered','archived']).optional(),
  previewUrl: z.string().url().max(500).optional().or(z.literal('')),
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
          const supabase = client()

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

        const databaseUrl = process.env.POSTGRES_URL || process.env.STORAGE_POSTGRES_URL || process.env.STORAGE_DATABASE_URL || process.env.DATABASE_URL
        if (!databaseUrl) return Response.json({ error: 'Database not configured' }, { status: 500 })

        const token = crypto.randomUUID().replaceAll('-', '') + crypto.randomUUID().replaceAll('-', '')
        const origin = new URL(request.url).origin
        const previewUrl = origin + '/kund-preview/' + encodeURIComponent(input.reference) + '?token=' + token
        const sql = postgres(databaseUrl, { max: 1, prepare: false })
        try {
          await sql`ALTER TABLE public.project_applications ADD COLUMN IF NOT EXISTS preview_token TEXT`
          const rows = await sql`
            UPDATE public.project_applications
            SET preview_token = ${token}, preview_url = ${previewUrl}, status = 'preview', updated_at = now()
            WHERE reference = ${input.reference}
            RETURNING *
          `
          if (!rows.length) return Response.json({ error: 'Application not found' }, { status: 404 })
          return Response.json({ application: rows[0] })
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
