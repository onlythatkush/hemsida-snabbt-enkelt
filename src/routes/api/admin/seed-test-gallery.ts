import { createClient } from '@supabase/supabase-js'
import { createFileRoute } from '@tanstack/react-router'
import { composeDesignSpec } from '@/lib/design/compose'
import { TEST_CASES } from '@/lib/design/test-cases'

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

const TEST_REF = /^TEST-\d{3}$/

function newToken() {
  return crypto.randomUUID().replaceAll('-', '') + crypto.randomUUID().replaceAll('-', '')
}

export const Route = createFileRoute('/api/admin/seed-test-gallery')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!authorized(request)) return Response.json({ error: 'Unauthorized' }, { status: 401 })
        try {
          const origin = new URL(request.url).origin
          const supabase = client()

          // Only ever touch rows whose reference matches TEST-0xx.
          const { data: existing, error: readError } = await supabase
            .from('project_applications')
            .select('reference, preview_token')
            .like('reference', 'TEST-%')
          if (readError) throw readError

          const tokens = new Map<string, string>()
          for (const row of existing || []) {
            if (TEST_REF.test(row.reference) && row.preview_token && String(row.preview_token).length >= 32) {
              tokens.set(row.reference, String(row.preview_token))
            }
          }

          let created = 0
          for (const testCase of TEST_CASES) {
            if (!TEST_REF.test(testCase.reference) || !testCase.company.startsWith('[TEST]')) continue
            const spec = composeDesignSpec(testCase)
            const token = tokens.get(testCase.reference) || newToken()
            const previewUrl = `${origin}/kund-preview/${encodeURIComponent(testCase.reference)}?token=${token}`
            const row = {
              reference: testCase.reference,
              name: testCase.company,
              company: testCase.company,
              email: testCase.email,
              phone: testCase.phone,
              address: testCase.address || null,
              description: testCase.description,
              social_links: testCase.social_links || null,
              website_type: testCase.website_type,
              colors: testCase.colors || null,
              extra_requests: testCase.extra_requests || null,
              wants_support: false,
              file_names: [],
              status: 'archived',
              preview_url: previewUrl,
              preview_token: token,
              design_spec: spec as any,
              design_family: spec.family,
              design_locked: false,
              updated_at: new Date().toISOString(),
            }

            if (tokens.has(testCase.reference) || (existing || []).some((e) => e.reference === testCase.reference)) {
              const { error } = await supabase
                .from('project_applications')
                .update(row)
                .eq('reference', testCase.reference)
                .like('reference', 'TEST-%')
              if (error) throw error
            } else {
              const { error } = await supabase.from('project_applications').insert(row)
              if (error) throw error
            }
            created += 1
          }

          return Response.json({ seeded: created })
        } catch (error) {
          console.error('Failed to seed test gallery', error)
          return Response.json({ error: 'Kunde inte skapa testexempel' }, { status: 500 })
        }
      },
    },
  },
})
