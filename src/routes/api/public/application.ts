import { createClient } from '@supabase/supabase-js'
import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'

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
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
        if (!supabaseUrl || !serviceKey) {
          return Response.json({ error: 'Server misconfigured' }, { status: 500 })
        }

        let parsed: z.infer<typeof schema>
        try {
          parsed = schema.parse(await request.json())
        } catch {
          return Response.json({ error: 'Invalid input' }, { status: 400 })
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
