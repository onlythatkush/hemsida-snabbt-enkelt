import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/api/public/health')({
  server: {
    handlers: {
      GET: async () => {
        const present = (name: string) => Boolean(process.env[name])
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
          },
        })
      },
    },
  },
})
