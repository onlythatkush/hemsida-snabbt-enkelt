import { createFileRoute } from '@tanstack/react-router'
import postgres from 'postgres'

const REFERENCE_PATTERN = /^[A-Z0-9-]{4,40}$/
const MAX_ROWS = 20

function databaseUrl() {
  return (
    process.env.POSTGRES_URL ||
    process.env.STORAGE_POSTGRES_URL ||
    process.env.STORAGE_DATABASE_URL ||
    process.env.DATABASE_URL ||
    process.env.SUPABASE_DB_URL
  )
}

export const Route = createFileRoute('/api/hub/applications')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const path = '/api/hub/applications'
        const expected = process.env.HUB_READONLY_KEY
        if (!expected) {
          console.error(`[hub] ${path} 500 server_misconfigured: HUB_READONLY_KEY missing`)
          return Response.json({ error: 'Server misconfigured' }, { status: 500 })
        }

        const provided = request.headers.get('x-hub-key')
        if (!provided || provided !== expected) {
          console.warn(`[hub] ${path} 401 unauthorized`)
          return Response.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const url = new URL(request.url)
        const reference = url.searchParams.get('reference')
        if (reference && !REFERENCE_PATTERN.test(reference)) {
          console.warn(`[hub] ${path} 400 invalid_reference_format`)
          return Response.json({ error: 'Invalid reference format' }, { status: 400 })
        }

        const connection = databaseUrl()
        if (!connection) {
          console.error(`[hub] ${path} 500 server_misconfigured: database url missing`)
          return Response.json({ error: 'Server misconfigured' }, { status: 500 })
        }

        const sql = postgres(connection, { max: 1, prepare: false })
        try {
          const rows = reference
            ? await sql`
                SELECT id, reference, status, created_at, updated_at,
                       (preview_url IS NOT NULL AND preview_url <> '') AS has_preview
                FROM public.project_applications
                WHERE reference = ${reference}
                LIMIT 1
              `
            : await sql`
                SELECT id, reference, status, created_at, updated_at,
                       (preview_url IS NOT NULL AND preview_url <> '') AS has_preview
                FROM public.project_applications
                ORDER BY created_at DESC
                LIMIT ${MAX_ROWS}
              `

          const applications = rows.map((row: any) => ({
            id: row.id,
            reference: row.reference,
            status: row.status,
            created_at: row.created_at,
            updated_at: row.updated_at,
            has_preview: Boolean(row.has_preview),
          }))

          console.log(
            `[hub] ${path} 200 mode=${reference ? 'single' : 'list'} ${
              applications.length ? 'found' : 'not_found'
            } count=${applications.length}`,
          )
          return Response.json({ count: applications.length, applications })
        } catch (error) {
          console.error(`[hub] ${path} 500 query_failed`, error)
          return Response.json({ error: 'Failed to load applications' }, { status: 500 })
        } finally {
          await sql.end()
        }
      },
    },
  },
})
