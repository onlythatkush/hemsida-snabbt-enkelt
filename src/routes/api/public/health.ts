import { createFileRoute } from '@tanstack/react-router'
import { classifyDbError, datasourceFingerprint, hubStore, withHubRead } from '@/lib/hub/db'

export const Route = createFileRoute('/api/public/health')({
  server: {
    handlers: {
      GET: async () => {
        const present = (name: string) => Boolean(process.env[name])

        let resendStatus: number | null = null
        const resendKey = process.env.RESEND_API_KEY
        if (resendKey) {
          try {
            const res = await fetch('https://api.resend.com/domains', {
              headers: { Authorization: `Bearer ${resendKey}` },
            })
            resendStatus = res.status
          } catch {
            resendStatus = 0
          }
        }

        // Secret-free database probe: store type, reachability and a data-source
        // ID so both deployments can prove they read the same database.
        const store = hubStore()
        let database: Record<string, unknown> = { store, reachable: false }
        if (store !== 'none') {
          try {
            const fp = await withHubRead(datasourceFingerprint)
            database = { store, reachable: true, datasourceId: fp.fingerprint, locked: Boolean(process.env.HUB_STORE) }
          } catch (e) {
            const info = classifyDbError(e)
            database = { store, reachable: false, error: info.kind, message: info.message, action: info.action }
          }
        }

        return Response.json({
          ok: database.reachable === true,
          database,
          env: {
            SUPABASE_URL: present('SUPABASE_URL'),
            VITE_SUPABASE_URL: present('VITE_SUPABASE_URL'),
            STORAGE_URL: present('STORAGE_URL'),
            VITE_STORAGE_URL: present('VITE_STORAGE_URL'),
            SUPABASE_SERVICE_ROLE_KEY: present('SUPABASE_SERVICE_ROLE_KEY'),
            SUPABASE_SECRET_KEY: present('SUPABASE_SECRET_KEY'),
            STORAGE_SERVICE_ROLE_KEY: present('STORAGE_SERVICE_ROLE_KEY'),
            STORAGE_SECRET_KEY: present('STORAGE_SECRET_KEY'),
            POSTGRES_URL: present('POSTGRES_URL'),
            STORAGE_POSTGRES_URL: present('STORAGE_POSTGRES_URL'),
            STORAGE_DATABASE_URL: present('STORAGE_DATABASE_URL'),
            DATABASE_URL: present('DATABASE_URL'),
            HUB_STORE: present('HUB_STORE'),
            ADMIN_ACCESS_KEY: present('ADMIN_ACCESS_KEY'),
            RESEND_API_KEY: present('RESEND_API_KEY'),
            INBOUND_EMAIL_WEBHOOK_SECRET: present('INBOUND_EMAIL_WEBHOOK_SECRET'),
          },
          email: {
            resendStatus,
            resendAuthenticated: resendStatus === 200,
            inboundSignatureConfigured: present('INBOUND_EMAIL_WEBHOOK_SECRET'),
          },
        })
      },
    },
  },
})
