import { createClient } from '@supabase/supabase-js'
import { createFileRoute } from '@tanstack/react-router'
import postgres from 'postgres'
import { z } from 'zod'

const MAX_SIZE = 15 * 1024 * 1024
const ALLOWED = new Set(['image/jpeg','image/png','image/webp','image/gif','application/pdf'])

function safeName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 120)
}

const ticketSchema = z.object({
  action: z.literal('ticket'),
  reference: z.string().trim().min(4).max(40),
  name: z.string().trim().min(1).max(255),
  type: z.string().trim().min(1).max(120),
  size: z.number().int().positive().max(MAX_SIZE),
})

const completeSchema = z.object({
  action: z.literal('complete'),
  reference: z.string().trim().min(4).max(40),
  paths: z.array(z.string().trim().min(1).max(500)).max(10),
})

export const Route = createFileRoute('/api/public/application-files')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const supabaseUrl =
          import.meta.env.VITE_SUPABASE_URL ||
          process.env.SUPABASE_URL
        const serviceKey =
          process.env.SUPABASE_SERVICE_ROLE_KEY ||
          process.env.SUPABASE_SECRET_KEY
        if (!supabaseUrl || !serviceKey) {
          return Response.json({ error: 'Storage server misconfigured' }, { status: 500 })
        }

        let body: unknown
        try {
          body = await request.json()
        } catch {
          return Response.json({ error: 'Invalid JSON' }, { status: 400 })
        }

        const supabase = createClient<any>(supabaseUrl, serviceKey, {
          auth: { persistSession: false, autoRefreshToken: false },
        })

        const { data: bucket } = await supabase.storage.getBucket('project-files')
        if (!bucket) {
          const { error: bucketError } = await supabase.storage.createBucket('project-files', {
            public: false,
            fileSizeLimit: MAX_SIZE,
            allowedMimeTypes: Array.from(ALLOWED),
          })
          if (bucketError) {
            console.error('Failed to create project-files bucket', bucketError)
            return Response.json({ error: 'File storage unavailable', detail: bucketError.message }, { status: 500 })
          }
        }

        const ticket = ticketSchema.safeParse(body)
        if (ticket.success) {
          if (!ALLOWED.has(ticket.data.type)) {
            return Response.json({ error: 'Filtypen stöds inte' }, { status: 400 })
          }
          const path = `${ticket.data.reference}/${crypto.randomUUID()}-${safeName(ticket.data.name)}`
          const { data, error } = await supabase.storage
            .from('project-files')
            .createSignedUploadUrl(path)

          if (error || !data?.token) {
            console.error('Failed to create signed upload URL', error)
            return Response.json({
              error: 'Kunde inte förbereda filuppladdning',
              detail: error?.message || 'Missing upload token',
            }, { status: 500 })
          }

          return Response.json({
            success: true,
            path,
            token: data.token,
          })
        }

        const complete = completeSchema.safeParse(body)
        if (complete.success) {
          const databaseUrl = process.env.POSTGRES_URL || process.env.DATABASE_URL
          if (!databaseUrl) {
            return Response.json({ error: 'Database not configured for file metadata' }, { status: 500 })
          }

          const sql = postgres(databaseUrl, { max: 1, prepare: false })
          try {
            await sql`
              UPDATE public.project_applications
              SET file_names = ${complete.data.paths}, updated_at = now()
              WHERE reference = ${complete.data.reference}
            `
          } catch (error) {
            console.error('Failed to attach files', error)
            return Response.json({
              error: 'Failed to attach files',
              detail: error instanceof Error ? error.message : String(error),
            }, { status: 500 })
          } finally {
            await sql.end()
          }

          return Response.json({ success: true, files: complete.data.paths })
        }

        return Response.json({ error: 'Invalid request' }, { status: 400 })
      },
    },
  },
})
