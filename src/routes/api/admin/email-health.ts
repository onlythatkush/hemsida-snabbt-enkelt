import { createFileRoute } from '@tanstack/react-router'
import { REPLY_DOMAIN, replyAddressFor } from '@/lib/email/reply-address'
import { composeDesignSpec } from '@/lib/design/compose'
import { REQUIRED_TABLES, hubDatabaseUrl, schemaReport, withHub } from '@/lib/hub/db'
import { hubSender } from '@/lib/hub/mail'

/**
 * Active health check for the hub. Every item is actually probed — never a
 * hard-coded "ready". Reports status + action only, never secret values.
 */

type Level = 'green' | 'yellow' | 'red'
type Check = { id: string; label: string; status: Level; detail?: string; action?: string }

function authorized(request: Request) {
  const expected = process.env.ADMIN_ACCESS_KEY
  const provided = request.headers.get('x-admin-key')
  return Boolean(expected && provided && provided === expected)
}

export const Route = createFileRoute('/api/admin/email-health')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        if (!authorized(request)) return Response.json({ error: 'Unauthorized' }, { status: 401 })

        const checks: Check[] = []
        const sender = hubSender()
        const receivingEndpoint = new URL('/api/public/inbound-email', request.url).toString()

        // 1. Database connection
        const dbConfigured = Boolean(hubDatabaseUrl())
        checks.push({
          id: 'database',
          label: 'Databasanslutning',
          status: dbConfigured ? 'green' : 'red',
          action: dbConfigured ? undefined : 'Sätt POSTGRES_URL (eller SUPABASE_DB_URL) i driftmiljön.',
        })

        // 2. Schema — tables AND columns the runtime actually uses
        let mailLog: { total: number; failed: number; lastSentAt: string | null } | null = null
        if (dbConfigured) {
          try {
            const { report, log } = await withHub(async (sql) => {
              const report = await schemaReport(sql)
              let log = null as any
              if (report.tables['preview_email_log']?.exists) {
                const rows = await sql<{ total: string; failed: string; last: string | null }[]>`
                  SELECT count(*)::text AS total,
                         count(*) FILTER (WHERE status = 'failed')::text AS failed,
                         max(sent_at)::text AS last
                  FROM public.preview_email_log
                `
                log = {
                  total: Number(rows[0]?.total ?? 0),
                  failed: Number(rows[0]?.failed ?? 0),
                  lastSentAt: rows[0]?.last ?? null,
                }
              }
              return { report, log }
            })
            mailLog = log
            const missingTables = REQUIRED_TABLES.filter((t) => !report.tables[t]?.exists)
            const missingCols = Object.entries(report.tables)
              .filter(([, v]) => v.exists && v.missingColumns.length)
              .map(([k, v]) => `${k}: ${v.missingColumns.join(', ')}`)
            checks.push({
              id: 'schema',
              label: 'Databasschema',
              status: missingTables.length ? 'red' : missingCols.length ? 'yellow' : 'green',
              detail: missingTables.length
                ? `Saknade tabeller: ${missingTables.join(', ')}`
                : missingCols.length
                  ? `Saknade kolumner — ${missingCols.join(' | ')}`
                  : `${REQUIRED_TABLES.length} tabeller på plats`,
              action: missingTables.length || missingCols.length ? 'Kör databasmigrationerna igen.' : undefined,
            })
          } catch (e) {
            checks.push({
              id: 'schema',
              label: 'Databasschema',
              status: 'red',
              detail: String((e as any)?.message || e).slice(0, 200),
              action: 'Kontrollera databasanslutningen.',
            })
          }
        } else {
          checks.push({ id: 'schema', label: 'Databasschema', status: 'red', detail: 'Ingen databasanslutning' })
        }

        // 3. Sending — the API key is actually verified against Resend
        const resendKey = process.env.RESEND_API_KEY
        if (!resendKey) {
          checks.push({
            id: 'sending',
            label: 'Utskick (Resend)',
            status: 'red',
            detail: 'RESEND_API_KEY saknas',
            action: 'Lägg till RESEND_API_KEY i driftmiljön.',
          })
        } else {
          try {
            const res = await fetch('https://api.resend.com/domains', {
              headers: { Authorization: `Bearer ${resendKey}` },
            })
            if (!res.ok) {
              checks.push({
                id: 'sending',
                label: 'Utskick (Resend)',
                status: 'red',
                detail: `Resend svarade ${res.status}`,
                action: 'Kontrollera att API-nyckeln är giltig.',
              })
            } else {
              const body = (await res.json()) as any
              const domains: any[] = body?.data ?? body?.domains ?? []
              const sendDomain = domains.find((d) => String(d?.name || '') === 'dinwebbpartner.com')
              const verified = String(sendDomain?.status || '').toLowerCase() === 'verified'
              checks.push({
                id: 'sending',
                label: 'Utskick (Resend)',
                status: verified ? 'green' : 'yellow',
                detail: verified
                  ? `Avsändare ${sender} — domänen är verifierad`
                  : `Avsändardomänen dinwebbpartner.com är ${sendDomain?.status || 'inte tillagd'}`,
                action: verified ? undefined : 'Verifiera dinwebbpartner.com för utskick hos Resend.',
              })
              // 4. Receiving domain expectation
              const replyDomain = domains.find((d) => String(d?.name || '') === REPLY_DOMAIN)
              checks.push({
                id: 'receiving_domain',
                label: `Mottagning (${REPLY_DOMAIN})`,
                status: replyDomain
                  ? String(replyDomain.status || '').toLowerCase() === 'verified' ? 'green' : 'yellow'
                  : 'red',
                detail: replyDomain
                  ? `Status: ${replyDomain.status}`
                  : 'Subdomänen finns inte hos e-postleverantören',
                action: replyDomain && String(replyDomain.status).toLowerCase() === 'verified'
                  ? undefined
                  : `Lägg till ${REPLY_DOMAIN} med MX-post för mottagning.`,
              })
            }
          } catch (e) {
            checks.push({
              id: 'sending',
              label: 'Utskick (Resend)',
              status: 'red',
              detail: String((e as any)?.message || e).slice(0, 160),
            })
          }
        }

        // 5. Inbound webhook secret
        checks.push({
          id: 'inbound_secret',
          label: 'Signeringsnyckel för inkommande mail',
          status: process.env.INBOUND_EMAIL_WEBHOOK_SECRET ? 'green' : 'red',
          detail: process.env.INBOUND_EMAIL_WEBHOOK_SECRET ? 'Konfigurerad' : 'INBOUND_EMAIL_WEBHOOK_SECRET saknas',
          action: process.env.INBOUND_EMAIL_WEBHOOK_SECRET
            ? undefined
            : 'Lägg webhookens signeringsnyckel som INBOUND_EMAIL_WEBHOOK_SECRET.',
        })

        // 6. Inbound endpoint self-probe: unsigned requests must be rejected
        try {
          const probe = await fetch(receivingEndpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: '{}',
          })
          const secure = probe.status === 401
          checks.push({
            id: 'inbound_endpoint',
            label: 'Mottagningsadress',
            status: secure ? 'green' : probe.status === 500 ? 'red' : 'yellow',
            detail: secure
              ? `${receivingEndpoint} svarar och avvisar osignerade anrop`
              : `Svarade ${probe.status} på ett osignerat anrop`,
            action: secure ? undefined : 'Kontrollera att signeringsnyckeln är satt i driftmiljön.',
          })
        } catch (e) {
          checks.push({
            id: 'inbound_endpoint',
            label: 'Mottagningsadress',
            status: 'red',
            detail: String((e as any)?.message || e).slice(0, 160),
          })
        }

        // 7. Generator dry run
        try {
          const spec = composeDesignSpec(
            {
              reference: 'HEALTH-CHECK',
              company: 'Hälsokontroll AB',
              description: 'Vi bygger kök och badrum åt privatpersoner i Stockholm.',
              website_type: 'Företagssida',
              colors: 'blått och grått',
              file_names: [],
            } as any,
            { revision: 1 },
          )
          const ok = Boolean(spec?.family && spec?.sections?.length)
          checks.push({
            id: 'generator',
            label: 'Designmotor',
            status: ok ? 'green' : 'red',
            detail: ok ? `Testkörning gav familjen "${spec.family}" med ${spec.sections.length} sektioner` : 'Testkörningen gav ingen design',
          })
        } catch (e) {
          checks.push({
            id: 'generator',
            label: 'Designmotor',
            status: 'red',
            detail: String((e as any)?.message || e).slice(0, 160),
          })
        }

        // 8. Mail log health
        if (mailLog) {
          checks.push({
            id: 'mail_log',
            label: 'Mailhistorik',
            status: mailLog.failed > 0 ? 'yellow' : 'green',
            detail: `${mailLog.total} loggade mail, ${mailLog.failed} misslyckade${mailLog.lastSentAt ? `, senast ${mailLog.lastSentAt}` : ''}`,
            action: mailLog.failed > 0 ? 'Öppna mailhistoriken och kontrollera felen.' : undefined,
          })
        }

        const worst: Level = checks.some((c) => c.status === 'red')
          ? 'red'
          : checks.some((c) => c.status === 'yellow')
            ? 'yellow'
            : 'green'

        return Response.json(
          {
            status: worst,
            ready: worst === 'green',
            sender,
            replyDomain: REPLY_DOMAIN,
            replyAddressExample: replyAddressFor('ORD-XXXXXX'),
            receivingEndpoint,
            checks,
          },
          { headers: { 'cache-control': 'no-store' } },
        )
      },
    },
  },
})
