import { createFileRoute } from '@tanstack/react-router'
import { env as nodeEnv } from 'node:process'

export const Route = createFileRoute('/api/public/health')({
  server: {
    handlers: {
      GET: async () => {
        const present = (name: string) => Boolean(nodeEnv[name])

        let resendStatus: number | null = null
        const resendKey = nodeEnv.RESEND_API_KEY
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

        return Response.json({
          ok: true,
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
            RESEND_API_KEY: present('RESEND_API_KEY'),
            INBOUND_EMAIL_WEBHOOK_SECRET: present('INBOUND_EMAIL_WEBHOOK_SECRET'),
          },
          email: {
            resendStatus,
            // A sending-only Resend key cannot call GET /domains (403/401).\n            // Do not misreport a restricted key as invalid.\n            resendAuthenticated: resendStatus === 200 ? true : null,\n            resendDiagnostic: resendStatus === 200 ? 'domain_read_allowed' : resendStatus === 401 || resendStatus === 403 ? 'domain_read_not_authorized_for_sending_key' : 'unverified',
            inboundSignatureConfigured: present('INBOUND_EMAIL_WEBHOOK_SECRET'),
          },
        })
      },
    },
  },
})
