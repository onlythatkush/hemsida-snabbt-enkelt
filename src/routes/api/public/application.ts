import { createClient } from '@supabase/supabase-js'
import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import postgres from 'postgres'

const schema = z.object({
  reference: z.string().trim().min(4).max(40),
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().min(4).max(60),
  company: z.string().trim().min(1).max(200),
  address: z.string().trim().max(200).optional().or(z.literal('')),
  description: z.string().trim().min(10).max(4000),
  socialLinks: z.string().trim().max(1000).optional().or(z.literal('')),
  websiteType: z.string().trim().min(1).max(80),
  colors: z.string().trim().max(300).optional().or(z.literal('')),
  extraRequests: z.string().trim().max(4000).optional().or(z.literal('')),
  wantsSupport: z.boolean().default(false),
  fileNames: z.array(z.string().trim().max(255)).max(10).default([]),
})

export const Route = createFileRoute('/api/public/application')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const supabaseUrl =
          import.meta.env.VITE_SUPABASE_URL ||
          import.meta.env.VITE_STORAGE_URL ||
          process.env.SUPABASE_URL ||
          process.env.STORAGE_URL
        const serviceKey =
          process.env.SUPABASE_SERVICE_ROLE_KEY ||
          process.env.SUPABASE_SECRET_KEY ||
          process.env.STORAGE_SERVICE_ROLE_KEY ||
          process.env.STORAGE_SECRET_KEY
        if (!supabaseUrl || !serviceKey) {
          return Response.json({
            error: 'Server misconfigured',
            missing: {
              supabaseUrl: !supabaseUrl,
              serviceKey: !serviceKey,
            },
          }, { status: 500 })
        }

        let parsed: z.infer<typeof schema>
        try {
          parsed = schema.parse(await request.json())
        } catch {
          return Response.json({ error: 'Invalid input' }, { status: 400 })
        }

        const databaseUrl =
          process.env.POSTGRES_URL ||
          process.env.STORAGE_POSTGRES_URL ||
          process.env.STORAGE_DATABASE_URL ||
          process.env.DATABASE_URL
        if (!databaseUrl) {
          return Response.json({
            error: 'Database not configured',
            hint: 'Missing POSTGRES_URL / STORAGE_POSTGRES_URL / STORAGE_DATABASE_URL / DATABASE_URL',
          }, { status: 500 })
        }

        const sql = postgres(databaseUrl, { max: 1, prepare: false })
        try {
          await sql`
            CREATE TABLE IF NOT EXISTS public.project_applications (
              id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
              reference TEXT NOT NULL UNIQUE,
              name TEXT NOT NULL,
              email TEXT NOT NULL,
              phone TEXT NOT NULL,
              company TEXT NOT NULL,
              address TEXT,
              description TEXT NOT NULL,
              social_links TEXT,
              website_type TEXT NOT NULL,
              colors TEXT,
              extra_requests TEXT,
              wants_support BOOLEAN NOT NULL DEFAULT false,
              file_names TEXT[] NOT NULL DEFAULT '{}',
              status TEXT NOT NULL DEFAULT 'new',
              preview_url TEXT,
              created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
              updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
            )
          `
        } finally {
          await sql.end()
        }

        const supabase = createClient<any>(supabaseUrl, serviceKey, {
          auth: { persistSession: false, autoRefreshToken: false },
        })

        const { error } = await supabase.from('project_applications').insert({
          reference: parsed.reference,
          name: parsed.name,
          email: parsed.email,
          phone: parsed.phone,
          company: parsed.company,
          address: parsed.address || null,
          description: parsed.description,
          social_links: parsed.socialLinks || null,
          website_type: parsed.websiteType,
          colors: parsed.colors || null,
          extra_requests: parsed.extraRequests || null,
          wants_support: parsed.wantsSupport,
          file_names: parsed.fileNames,
          status: 'new',
        })

        if (error) {
          console.error('Failed to save application', error)
          return Response.json({ error: 'Failed to save application' }, { status: 500 })
        }

        return Response.json({ success: true, reference: parsed.reference })
      },
    },
  },
})
