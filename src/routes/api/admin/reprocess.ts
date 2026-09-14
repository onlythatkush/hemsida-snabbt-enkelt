import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { logEvent, withHub } from '@/lib/hub/db'
import { runRevisionJob } from '@/lib/hub/revise'
import { EMPTY_DIRECTIVES, type RevisionDirectives } from '@/lib/revision/types'

const schema = z.object({
  reference: z.string().min(4).max(40),
  changeRequestId: z.string().uuid(),
})

function authorized(request: Request) {
  const expected = process.env.ADMIN_ACCESS_KEY
  const provided = request.headers.get('x-admin-key')
  return Boolean(expected && provided && provided === expected)
}

/**
 * Admin retry for a customer change request that failed or needs review.
 *
 * Safe to press twice: the revision job keeps the same idempotency key, so a
 * job that already succeeded is reported back instead of re-run, and the
 * acknowledgement email is never sent again.
 */
export const Route = createFileRoute('/api/admin/reprocess')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!authorized(request)) return Response.json({ error: 'Unauthorized' }, { status: 401 })
        let input: z.infer<typeof schema>
        try { input = schema.parse(await request.json()) }
        catch { return Response.json({ error: 'Invalid input' }, { status: 400 }) }

        try {
          return await withHub(async (sql) => {
            const apps = await sql`
              SELECT * FROM public.project_applications WHERE upper(reference) = upper(${input.reference}) LIMIT 1
            `
            if (!apps.length) return Response.json({ error: 'Ansökan hittades inte' }, { status: 404 })
            const app = apps[0] as any
            if (app.design_locked) {
              return Response.json({ error: 'Designen är låst av kundens godkännande' }, { status: 409 })
            }

            const rows = await sql`
              SELECT * FROM public.customer_change_requests
              WHERE id = ${input.changeRequestId} AND reference = ${app.reference} LIMIT 1
            `
            if (!rows.length) return Response.json({ error: 'Kundsvaret hittades inte' }, { status: 404 })
            const cr = rows[0] as any

            const directives: RevisionDirectives = { ...EMPTY_DIRECTIVES, ...(cr.directives || {}) }
            const summary: string[] = Array.isArray(directives.summary) ? directives.summary : []

            await logEvent(sql, app.reference, 'revision_retry', 'Admin körde om kundens ändringar', {
              changeRequestId: cr.id,
            })

            const outcome = await runRevisionJob(sql, {
              app,
              changeRequestId: cr.id,
              directives,
              summary,
              origin: new URL(request.url).origin,
              mailAllowed: !/^TEST-/i.test(app.reference),
              sendAck: false,
              source: 'retry',
            })
            if (!outcome.ok) return Response.json({ error: outcome.error || 'Revision failed' }, { status: 500 })
            if (outcome.duplicateJob) {
              return Response.json({ ok: true, skipped: 'already_processed' })
            }
            return Response.json({ ...outcome, ok: true })
          })
        } catch (error) {
          console.error('[admin/reprocess] failed', error)
          return Response.json({ error: String((error as any)?.message || error) }, { status: 500 })
        }
      },
    },
  },
})
