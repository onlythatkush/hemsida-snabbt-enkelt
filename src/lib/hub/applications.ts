import type { HubSql } from './db'

/** Reads only the authoritative submission database; never a fallback store. */
export async function listApplications(sql: HubSql) {
  return sql`SELECT * FROM public.project_applications ORDER BY created_at DESC LIMIT 200`
}

export async function findApplication(sql: HubSql, reference: string) {
  const rows = await sql`SELECT * FROM public.project_applications WHERE upper(reference) = ${reference.trim().toUpperCase()} LIMIT 1`
  return rows[0] ?? null
}