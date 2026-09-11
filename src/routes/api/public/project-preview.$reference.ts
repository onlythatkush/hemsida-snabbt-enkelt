import { createClient } from '@supabase/supabase-js'
import { createFileRoute } from '@tanstack/react-router'
import postgres from 'postgres'
import { composeDesignSpec } from '@/lib/design/compose'
import type { DesignSpec } from '@/lib/design/types'

function databaseUrl() {
  return process.env.POSTGRES_URL || process.env.STORAGE_POSTGRES_URL || process.env.STORAGE_DATABASE_URL || process.env.DATABASE_URL || process.env.SUPABASE_DB_URL
}

function supabaseClient() {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY
  if (!supabaseUrl || !serviceKey) return null
  return createClient<any>(supabaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } })
}

export const Route = createFileRoute('/api/public/project-preview/$reference')({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const token = new URL(request.url).searchParams.get('token') || ''
        if (!token || token.length < 32) return Response.json({ error: 'Invalid preview link' }, { status: 401 })

        const db = databaseUrl()
        if (!db) return Response.json({ error: 'Database not configured' }, { status: 500 })

        const sql = postgres(db, { max: 1, prepare: false })
        try {
          await sql`ALTER TABLE public.project_applications ADD COLUMN IF NOT EXISTS preview_token TEXT`
          await sql`ALTER TABLE public.project_applications ADD COLUMN IF NOT EXISTS design_spec JSONB`
          const rows = await sql`
            SELECT reference, company, description, social_links, website_type, colors,
                   extra_requests, file_names, preview_token, design_spec, address, email, phone
            FROM public.project_applications
            WHERE reference = ${params.reference} AND preview_token = ${token}
            LIMIT 1
          `
          if (!rows.length) return Response.json({ error: 'Preview not found' }, { status: 404 })

          const item = rows[0] as any
          const spec: DesignSpec =
            item.design_spec && item.design_spec.version
              ? (item.design_spec as DesignSpec)
              : composeDesignSpec({
                  reference: item.reference,
                  company: item.company,
                  description: item.description,
                  website_type: item.website_type,
                  colors: item.colors,
                  extra_requests: item.extra_requests,
                  social_links: item.social_links,
                  address: item.address,
                  email: item.email,
                  phone: item.phone,
                  file_names: Array.isArray(item.file_names) ? item.file_names : [],
                })

          const supabase = supabaseClient()
          if (supabase) {
            for (const image of spec.images) {
              const { data } = await supabase.storage.from('project-files').createSignedUrl(image.path, 60 * 60)
              if (data?.signedUrl) image.url = data.signedUrl
            }
          }

          return Response.json({ spec })
        } catch (error) {
          console.error(error)
          return Response.json({ error: 'Failed to load preview' }, { status: 500 })
        } finally {
          await sql.end()
        }
      },
    },
  },
})
