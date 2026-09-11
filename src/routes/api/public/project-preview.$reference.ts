import { createClient } from '@supabase/supabase-js'
import { createFileRoute } from '@tanstack/react-router'
import postgres from 'postgres'

function databaseUrl() {
  return process.env.POSTGRES_URL || process.env.STORAGE_POSTGRES_URL || process.env.STORAGE_DATABASE_URL || process.env.DATABASE_URL
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
          const rows = await sql`
            SELECT reference, company, description, social_links, website_type, colors,
                   extra_requests, file_names, preview_token
            FROM public.project_applications
            WHERE reference = ${params.reference} AND preview_token = ${token}
            LIMIT 1
          `
          if (!rows.length) return Response.json({ error: 'Preview not found' }, { status: 404 })

          const item = rows[0] as any
          const files: { name: string; url: string; type: 'image' | 'file' }[] = []
          const supabase = supabaseClient()
          if (supabase && Array.isArray(item.file_names)) {
            for (const path of item.file_names.slice(0, 10)) {
              const { data } = await supabase.storage.from('project-files').createSignedUrl(path, 60 * 60)
              if (data?.signedUrl) {
                const name = String(path).split('/').pop() || 'Fil'
                const image = /\.(jpg|jpeg|png|webp|gif)$/i.test(name)
                files.push({ name, url: data.signedUrl, type: image ? 'image' : 'file' })
              }
            }
          }

          return Response.json({
            project: {
              reference: item.reference,
              company: item.company,
              description: item.description,
              socialLinks: item.social_links,
              websiteType: item.website_type,
              colors: item.colors,
              extraRequests: item.extra_requests,
              files,
            },
          })
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
