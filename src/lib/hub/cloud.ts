import { createClient } from '@supabase/supabase-js'
export { hubStore, type HubStore } from './db'

/** Server-only service-role client for Lovable Cloud (storage/Data API). */
export function cloudAdmin() {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Lovable Cloud server config saknas')
  return createClient<any>(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
}
