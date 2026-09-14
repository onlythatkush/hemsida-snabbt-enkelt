import { createFileRoute } from '@tanstack/react-router'
import postgres from 'postgres'
import { REPLY_DOMAIN, replyAddressFor } from '@/lib/email/reply-address'

/**
 * Read-only configuration health for the design review loop.
 * Reports booleans only — never secret values.
 */

function authorized(request: Request) {
  const expected = process.env.ADMIN_ACCESS_KEY
  const provided = request.headers.get('x-admin-key')
  return Boolean(expected && provided && provided === expected)
}

function databaseUrl() {
  return (
    process.env.POSTGRES_URL ||
    process.env.STORAGE_POSTGRES_URL ||
    process.env.STORAGE_DATABASE_URL ||
    process.env.DATABASE_URL ||
    process.env.SUPABASE_DB_URL
  )
}

export const Route = createFileRoute('/api/admin/email-health')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        if (!authorized(request)) return Response.json({ error: 'Unauthorized' }, { status: 401 })

        const configuredFrom = (process.env.RESEND_FROM || '').trim()
        const sender =
          configuredFrom && !/resend\.dev/i.test(configuredFrom)
            ? configuredFrom
            : 'Din Webbpartner <preview@dinwebbpartner.com>'

        const checks: Record<string, any> = {
          sendingConfigured: Boolean(process.env.RESEND_API_KEY),
          sender,
          replyDomain: REPLY_DOMAIN,
          replyAddressExample: replyAddressFor('ORD-XXXXXX'),
          inboundSecretConfigured: Boolean(process.env.INBOUND_EMAIL_WEBHOOK_SECRET),
          receivingEndpoint: new URL('/api/public/inbound-email', request.url).toString(),
          receivingEndpointReady: Boolean(process.env.INBOUND_EMAIL_WEBHOOK_SECRET),
          autoSendRevisions:
            String(process.env.AUTO_SEND_REVISIONS || '').toLowerCase() !== 'false' &&
            Boolean(process.env.ADMIN_ACCESS_KEY),
          databaseConfigured: Boolean(databaseUrl()),
          schema: { tables: {} as Record<string, boolean>, ready: false },
        }

        const url = databaseUrl()
        if (url) {
          const sql = postgres(url, { max: 1, prepare: false })
          try {
            const rows = await sql<{ table_name: string }[]>`
              SELECT table_name FROM information_schema.tables
              WHERE table_schema = 'public'
                AND table_name IN ('project_applications','preview_email_log','customer_change_requests','application_events')
            `
            const present = new Set(rows.map((r) => r.table_name))
            const required = ['project_applications', 'preview_email_log', 'customer_change_requests', 'application_events']
            for (const t of required) checks.schema.tables[t] = present.has(t)
            checks.schema.ready = required.every((t) => present.has(t))
          } catch (e) {
            checks.schema.error = String((e as any)?.message || e).slice(0, 200)
          } finally {
            await sql.end({ timeout: 5 }).catch(() => undefined)
          }
        }

        checks.ready =
          checks.sendingConfigured && checks.inboundSecretConfigured && checks.databaseConfigured && checks.schema.ready

        return Response.json(checks, { headers: { 'cache-control': 'no-store' } })
      },
    },
  },
})
