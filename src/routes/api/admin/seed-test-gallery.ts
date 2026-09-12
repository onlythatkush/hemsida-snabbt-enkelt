import { createFileRoute } from '@tanstack/react-router'
import postgres from 'postgres'
import { composeDesignSpec } from '@/lib/design/compose'
import { TEST_CASES } from '@/lib/design/test-cases'

function authorized(request: Request) {
  const expected = process.env.ADMIN_ACCESS_KEY
  const provided = request.headers.get('x-admin-key')
  return Boolean(expected && provided && provided === expected)
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

        const databaseUrl =
          process.env.POSTGRES_URL ||
          process.env.STORAGE_POSTGRES_URL ||
          process.env.STORAGE_DATABASE_URL ||
          process.env.DATABASE_URL ||
          process.env.SUPABASE_DB_URL

        if (!databaseUrl) return Response.json({ error: 'Database not configured' }, { status: 500 })

        const origin = new URL(request.url).origin
        const sql = postgres(databaseUrl, { max: 1, prepare: false })

        try {
          try {
            await sql`ALTER TABLE public.project_applications ADD COLUMN IF NOT EXISTS preview_token TEXT`
            await sql`ALTER TABLE public.project_applications ADD COLUMN IF NOT EXISTS design_spec JSONB`
            await sql`ALTER TABLE public.project_applications ADD COLUMN IF NOT EXISTS design_family TEXT`
            await sql`ALTER TABLE public.project_applications ADD COLUMN IF NOT EXISTS design_locked BOOLEAN NOT NULL DEFAULT false`
          } catch {
            // Schema is normally managed by migrations.
          }

          const existing = await sql`
            SELECT reference, preview_token
            FROM public.project_applications
            WHERE reference LIKE 'TEST-%'
          `

          const tokens = new Map<string, string>()
          for (const row of existing as any[]) {
            if (TEST_REF.test(String(row.reference)) && row.preview_token && String(row.preview_token).length >= 32) {
              tokens.set(String(row.reference), String(row.preview_token))
            }
          }

          let seeded = 0

          for (const testCase of TEST_CASES) {
            if (!TEST_REF.test(testCase.reference) || !testCase.company.startsWith('[TEST]')) continue

            const spec = composeDesignSpec(testCase)
            const token = tokens.get(testCase.reference) || newToken()
            const previewUrl = `${origin}/kund-preview/${encodeURIComponent(testCase.reference)}?token=${token}`

            await sql`
              INSERT INTO public.project_applications (
                reference, name, email, phone, company, address, description, social_links,
                website_type, colors, extra_requests, wants_support, file_names,
                status, preview_url, preview_token, design_spec, design_family, design_locked
              )
              VALUES (
                ${testCase.reference},
                ${testCase.company},
                ${testCase.email || ''},
                ${testCase.phone || ''},
                ${testCase.company},
                ${testCase.address || null},
                ${testCase.description},
                ${testCase.social_links || null},
                ${testCase.website_type},
                ${testCase.colors || null},
                ${testCase.extra_requests || null},
                false,
                ${sql.array([] as string[])},
                'archived',
                ${previewUrl},
                ${token},
                ${sql.json(spec as any)},
                ${spec.family},
                false
              )
              ON CONFLICT (reference) DO UPDATE SET
                name = EXCLUDED.name,
                email = EXCLUDED.email,
                phone = EXCLUDED.phone,
                company = EXCLUDED.company,
                address = EXCLUDED.address,
                description = EXCLUDED.description,
                social_links = EXCLUDED.social_links,
                website_type = EXCLUDED.website_type,
                colors = EXCLUDED.colors,
                extra_requests = EXCLUDED.extra_requests,
                wants_support = false,
                file_names = EXCLUDED.file_names,
                status = 'archived',
                preview_url = EXCLUDED.preview_url,
                preview_token = EXCLUDED.preview_token,
                design_spec = EXCLUDED.design_spec,
                design_family = EXCLUDED.design_family,
                design_locked = false,
                updated_at = now()
              WHERE public.project_applications.reference LIKE 'TEST-%'
            `

            seeded += 1
          }

          return Response.json({ seeded })
        } catch (error) {
          console.error('Failed to seed test gallery', error)
          return Response.json({ error: 'Kunde inte skapa testexempel' }, { status: 500 })
        } finally {
          await sql.end()
        }
      },
    },
  },
})
