import { createClient } from '@supabase/supabase-js'
import { hubDatabaseUrl } from './db'

/**
 * Storage selection for the order hub.
 *
 * A configured direct Postgres URL always wins (Vercel/Coolify deployments).
 * Without one, the Lovable-hosted app uses its own Lovable Cloud database via
 * the server-only service-role client. Each deployment therefore uses exactly
 * ONE store for submissions, confirmation lookups and the admin list.
 */
export type HubStore = 'postgres' | 'cloud' | 'none'

export function hubStore(): HubStore {
  // Explicit external order database (Vercel/Coolify) always wins.
  if (process.env.POSTGRES_URL || process.env.STORAGE_POSTGRES_URL || process.env.STORAGE_DATABASE_URL || process.env.DATABASE_URL) return 'postgres'
  // SUPABASE_DB_URL is a platform-injected internal URL that is not reachable
  // from every runtime, so the Cloud service-role client is preferred over it.
  if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) return 'cloud'
  return hubDatabaseUrl() ? 'postgres' : 'none'
}

export function cloudAdmin() {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Lovable Cloud server config saknas (SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY)')
  return createClient<any>(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
}
