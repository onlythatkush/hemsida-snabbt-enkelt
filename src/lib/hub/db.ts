import postgres from 'postgres'

/**
 * ONE database path for the whole hub.
 *
 * Root cause of the production PGRST205 error: orders/events were read through
 * a direct Postgres connection while the email log was read through the Data
 * API with a service-role key. In production those two point at different
 * databases, so `public.preview_email_log` looked "missing" even though the
 * migration had run. Everything hub-related now goes through this module.
 */
export function hubDatabaseUrl(): string | undefined {
  return (
    process.env.POSTGRES_URL ||
    process.env.STORAGE_POSTGRES_URL ||
    process.env.STORAGE_DATABASE_URL ||
    process.env.DATABASE_URL ||
    process.env.SUPABASE_DB_URL
  )
}

export type HubSql = ReturnType<typeof postgres>

export function hubSql(): HubSql {
  const url = hubDatabaseUrl()
  if (!url) throw new Error('Databasen är inte konfigurerad (POSTGRES_URL/SUPABASE_DB_URL saknas)')
  return postgres(url, { max: 1, prepare: false })
}

/** Runs `fn` with a short-lived connection that is always closed. */
export async function withHub<T>(fn: (sql: HubSql) => Promise<T>): Promise<T> {
  const sql = hubSql()
  try {
    return await fn(sql)
  } finally {
    await sql.end({ timeout: 5 }).catch(() => undefined)
  }
}

/** Tables every runtime path depends on. Used by the health check. */
export const REQUIRED_TABLES = [
  'project_applications',
  'preview_email_log',
  'customer_change_requests',
  'application_events',
  'design_versions',
  'revision_jobs',
] as const

/** Columns added after the first release that runtime code relies on. */
export const REQUIRED_COLUMNS: Record<string, string[]> = {
  project_applications: [
    'design_spec', 'design_family', 'design_locked', 'preview_url', 'preview_token',
    'qa_status', 'qa_score', 'qa_report', 'qa_accepted_at',
    'design_revision', 'customer_approved_at', 'approved_revision', 'review_note',
  ],
  preview_email_log: [
    'reference', 'recipient', 'provider', 'provider_message_id', 'status',
    'kind', 'revision', 'change_request_id', 'idempotency_key', 'sent_at',
  ],
  customer_change_requests: [
    'reference', 'raw_text', 'directives', 'message_id', 'matched_via', 'status',
    'intent', 'intent_reason', 'subject', 'category', 'confidence', 'classifier',
    'extracted', 'routing', 'retry_count', 'last_error', 'answered_at',
  ],
  application_events: ['reference', 'event_type', 'label', 'details'],
  design_versions: ['reference', 'revision', 'design_spec', 'qa_status', 'preview_url', 'source'],
  revision_jobs: ['reference', 'status', 'retry_count', 'last_error', 'idempotency_key'],
}

export async function schemaReport(sql: HubSql) {
  const rows = await sql<{ table_name: string; column_name: string }[]>`
    SELECT table_name, column_name FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = ANY(${REQUIRED_TABLES as unknown as string[]})
  `
  const byTable = new Map<string, Set<string>>()
  for (const r of rows) {
    if (!byTable.has(r.table_name)) byTable.set(r.table_name, new Set())
    byTable.get(r.table_name)!.add(r.column_name)
  }
  const tables: Record<string, { exists: boolean; missingColumns: string[] }> = {}
  for (const t of REQUIRED_TABLES) {
    const cols = byTable.get(t)
    tables[t] = {
      exists: Boolean(cols),
      missingColumns: (REQUIRED_COLUMNS[t] || []).filter((c) => !cols?.has(c)),
    }
  }
  const ready = Object.values(tables).every((t) => t.exists && t.missingColumns.length === 0)
  return { tables, ready }
}

/** Records a hub timeline event. Never throws — the timeline is observability. */
export async function logEvent(
  sql: HubSql,
  reference: string,
  eventType: string,
  label: string,
  details?: Record<string, unknown>,
) {
  try {
    await sql`
      INSERT INTO public.application_events (reference, event_type, label, details)
      VALUES (${reference}, ${eventType}, ${label}, ${details ? sql.json(details as any) : null})
    `
  } catch (e) {
    console.error('[hub] event log failed', eventType, e)
  }
}
