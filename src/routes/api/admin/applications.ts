import { createClient } from '@supabase/supabase-js'
import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'

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
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceKey) throw new Error('Server misconfigured')
  return createClient<any>(supabaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } })
}

export const Route = createFileRoute('/api/admin/applications')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        if (!authorized(request)) return Response.json({ error: 'Unauthorized' }, { status: 401 })
        try {
          const { data, error } = await client()
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
