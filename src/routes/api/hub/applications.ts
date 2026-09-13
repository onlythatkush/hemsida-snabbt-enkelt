import { createClient } from '@supabase/supabase-js'
import { createFileRoute } from '@tanstack/react-router'

const REFERENCE_PATTERN = /^[A-Z0-9-]{4,40}$/
const MAX_ROWS = 20

function client() {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY
  if (!supabaseUrl || !serviceKey) return null
  return createClient<any>(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
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

        const supabase = client()
        if (!supabase) {
          console.error(`[hub] ${path} 500 server_misconfigured: supabase credentials missing`)
          return Response.json({ error: 'Server misconfigured' }, { status: 500 })
        }

        try {
          let query = supabase
            .from('project_applications')
            .select('id, reference, status, created_at, updated_at, preview_url')
            .order('created_at', { ascending: false })
            .limit(reference ? 1 : MAX_ROWS)

          if (reference) query = query.eq('reference', reference)

          const { data, error } = await query
          if (error) throw error

          const applications = (data ?? []).map((row: any) => ({
            id: row.id,
            reference: row.reference,
            status: row.status,
            created_at: row.created_at,
            updated_at: row.updated_at,
            has_preview: Boolean(row.preview_url && row.preview_url !== ''),
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
        }
      },
    },
  },
})
