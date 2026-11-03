import postgres from 'postgres'
import { createClient } from '@supabase/supabase-js'
import { createCloudSql } from './cloud-sql'

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

/**
 * ONE store per deployment.
 * - HUB_STORE=postgres|cloud forces a store (recommended in production so a
 *   missing POSTGRES_URL can never silently fall back to another database).
 * - Otherwise an explicit external Postgres URL wins, then Lovable Cloud.
 */
export type HubStore = 'postgres' | 'cloud' | 'none'

function explicitPostgresUrl() {
  return process.env.POSTGRES_URL || process.env.STORAGE_POSTGRES_URL || process.env.STORAGE_DATABASE_URL || process.env.DATABASE_URL
}
function cloudConfigured() {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY)
}

export function hubStore(): HubStore {
  const forced = (process.env.HUB_STORE || '').trim().toLowerCase()
  if (forced === 'postgres') return explicitPostgresUrl() ? 'postgres' : 'none'
  if (forced === 'cloud') return cloudConfigured() ? 'cloud' : 'none'
  if (explicitPostgresUrl()) return 'postgres'
  // SUPABASE_DB_URL is platform-internal and not reachable from every runtime.
  if (cloudConfigured()) return 'cloud'
  return hubDatabaseUrl() ? 'postgres' : 'none'
}

export function hubStoreMissingMessage(): string {
  const forced = (process.env.HUB_STORE || '').trim().toLowerCase()
  if (forced === 'postgres') return 'HUB_STORE=postgres men POSTGRES_URL saknas i driftmiljön.'
  if (forced === 'cloud') return 'HUB_STORE=cloud men Lovable Cloud-serverkonfiguration saknas.'
  return 'Ingen orderdatabas är konfigurerad (POSTGRES_URL eller Lovable Cloud).'
}

export function hubSql(): HubSql {
  const store = hubStore()
  if (store === 'cloud') {
    const client = createClient<any>(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
    return createCloudSql(client) as HubSql
  }
  if (store === 'postgres') {
    const url = explicitPostgresUrl() || hubDatabaseUrl()
    return postgres(url!, { max: 1, prepare: false })
  }
  throw new Error(hubStoreMissingMessage())
}

let schemaEnsured = false
let schemaAttempts = 0

/**
 * Idempotent self-healing schema bootstrap.
 *
 * The runtime database (Coolify/Vercel Postgres) is not the same instance the
 * migration tooling reaches, which is exactly how production ended up missing
 * `preview_email_log`. Every hub connection therefore makes sure the tables and
 * columns it needs exist. All statements are IF NOT EXISTS and run once per
 * process.
 */
export async function ensureHubSchema(sql: HubSql) {
  if (schemaEnsured) return
  // Lovable Cloud schema is owned by migrations; hub_exec rejects DDL anyway.
  if ((sql as any).__cloud) return
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS public.application_events (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        reference TEXT NOT NULL,
        event_type TEXT NOT NULL,
        label TEXT NOT NULL,
        details JSONB,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )`
    await sql`CREATE INDEX IF NOT EXISTS application_events_reference_idx ON public.application_events (reference, created_at DESC)`

    await sql`
      CREATE TABLE IF NOT EXISTS public.preview_email_log (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        reference TEXT NOT NULL,
        company TEXT,
        recipient TEXT NOT NULL,
        preview_url TEXT,
        sender TEXT,
        provider TEXT NOT NULL,
        provider_message_id TEXT,
        status TEXT NOT NULL DEFAULT 'queued',
        error_message TEXT,
        metadata JSONB,
        sent_at TIMESTAMPTZ,
        delivered_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )`
    await sql`ALTER TABLE public.preview_email_log ADD COLUMN IF NOT EXISTS kind TEXT`
    await sql`ALTER TABLE public.preview_email_log ADD COLUMN IF NOT EXISTS revision INTEGER`
    await sql`ALTER TABLE public.preview_email_log ADD COLUMN IF NOT EXISTS change_request_id UUID`
    await sql`ALTER TABLE public.preview_email_log ADD COLUMN IF NOT EXISTS idempotency_key TEXT`
    await sql`CREATE UNIQUE INDEX IF NOT EXISTS preview_email_log_idempotency_key_idx ON public.preview_email_log (idempotency_key) WHERE idempotency_key IS NOT NULL`

    await sql`
      CREATE TABLE IF NOT EXISTS public.customer_change_requests (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        reference TEXT NOT NULL,
        raw_text TEXT NOT NULL,
        directives JSONB,
        from_email TEXT,
        message_id TEXT NOT NULL,
        matched_via TEXT,
        status TEXT NOT NULL DEFAULT 'received',
        error TEXT,
        revision INTEGER,
        subject TEXT,
        intent TEXT,
        intent_reason TEXT,
        received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        processed_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )`
    for (const stmt of [
      sql`ALTER TABLE public.customer_change_requests ADD COLUMN IF NOT EXISTS category TEXT`,
      sql`ALTER TABLE public.customer_change_requests ADD COLUMN IF NOT EXISTS confidence NUMERIC`,
      sql`ALTER TABLE public.customer_change_requests ADD COLUMN IF NOT EXISTS classifier TEXT`,
      sql`ALTER TABLE public.customer_change_requests ADD COLUMN IF NOT EXISTS extracted JSONB`,
      sql`ALTER TABLE public.customer_change_requests ADD COLUMN IF NOT EXISTS routing TEXT`,
      sql`ALTER TABLE public.customer_change_requests ADD COLUMN IF NOT EXISTS retry_count INTEGER NOT NULL DEFAULT 0`,
      sql`ALTER TABLE public.customer_change_requests ADD COLUMN IF NOT EXISTS last_error TEXT`,
      sql`ALTER TABLE public.customer_change_requests ADD COLUMN IF NOT EXISTS answered_at TIMESTAMPTZ`,
      sql`ALTER TABLE public.customer_change_requests ADD COLUMN IF NOT EXISTS subject TEXT`,
    ]) await stmt
    await sql`CREATE UNIQUE INDEX IF NOT EXISTS customer_change_requests_message_id_idx ON public.customer_change_requests (message_id)`

    await sql`
      CREATE TABLE IF NOT EXISTS public.design_versions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        reference TEXT NOT NULL,
        revision INTEGER NOT NULL,
        design_spec JSONB NOT NULL,
        design_family TEXT,
        design_version INTEGER,
        preview_url TEXT,
        qa_status TEXT,
        qa_score INTEGER,
        qa_report JSONB,
        source TEXT NOT NULL DEFAULT 'admin',
        change_request_id UUID,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )`
    await sql`CREATE UNIQUE INDEX IF NOT EXISTS design_versions_reference_revision_idx ON public.design_versions (reference, revision)`

    await sql`
      CREATE TABLE IF NOT EXISTS public.revision_jobs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        reference TEXT NOT NULL,
        change_request_id UUID,
        kind TEXT NOT NULL DEFAULT 'design_revision',
        status TEXT NOT NULL DEFAULT 'queued',
        revision INTEGER,
        retry_count INTEGER NOT NULL DEFAULT 0,
        last_error TEXT,
        detail JSONB,
        idempotency_key TEXT,
        started_at TIMESTAMPTZ,
        finished_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )`
    await sql`CREATE UNIQUE INDEX IF NOT EXISTS revision_jobs_idempotency_key_idx ON public.revision_jobs (idempotency_key) WHERE idempotency_key IS NOT NULL`

    // project_applications is created by the submission flow — only extend it.
    for (const stmt of [
      sql`ALTER TABLE IF EXISTS public.project_applications ADD COLUMN IF NOT EXISTS design_revision INTEGER`,
      sql`ALTER TABLE IF EXISTS public.project_applications ADD COLUMN IF NOT EXISTS customer_approved_at TIMESTAMPTZ`,
      sql`ALTER TABLE IF EXISTS public.project_applications ADD COLUMN IF NOT EXISTS approved_revision INTEGER`,
      sql`ALTER TABLE IF EXISTS public.project_applications ADD COLUMN IF NOT EXISTS review_note TEXT`,
      sql`ALTER TABLE IF EXISTS public.project_applications ADD COLUMN IF NOT EXISTS qa_status TEXT`,
      sql`ALTER TABLE IF EXISTS public.project_applications ADD COLUMN IF NOT EXISTS qa_score INTEGER`,
      sql`ALTER TABLE IF EXISTS public.project_applications ADD COLUMN IF NOT EXISTS qa_report JSONB`,
      sql`ALTER TABLE IF EXISTS public.project_applications ADD COLUMN IF NOT EXISTS qa_accepted_at TIMESTAMPTZ`,
    ]) await stmt

    schemaEnsured = true
  } catch (e) {
    // A restricted role (or a race with a concurrent bootstrap) must not make
    // every request retry DDL forever — the health check reports the real state.
    schemaAttempts += 1
    if (schemaAttempts >= 3) schemaEnsured = true
    console.error('[hub] schema bootstrap failed', (e as any)?.message || e)
  }
}

/** Runs `fn` with a short-lived connection that is always closed. */
export async function withHub<T>(fn: (sql: HubSql) => Promise<T>): Promise<T> {
  const sql = hubSql()
  try {
    await ensureHubSchema(sql)
    return await fn(sql)
  } finally {
    await sql.end({ timeout: 5 }).catch(() => undefined)
  }
}


/** Tables every runtime path depends on. Used by the health check. */
export async function withHubRead<T>(fn: (sql: HubSql) => Promise<T>): Promise<T> {
  const sql = hubSql()
  try {
    return await fn(sql)
  } finally {
    await sql.end({ timeout: 5 }).catch(() => undefined)
  }
}

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

export type DbErrorInfo = { kind: string; message: string; action: string }

/** Maps driver/RPC errors to actionable, secret-free diagnostics. */
export function classifyDbError(e: unknown): DbErrorInfo {
  const err = e as any
  const code = String(err?.code ?? '')
  const msg = String(err?.message ?? e ?? '')
  if (code === 'ENOTFOUND' || /ENOTFOUND|getaddrinfo/i.test(msg) || /tenant(\/| or )user.*not found/i.test(msg))
    return { kind: 'host_not_found', message: 'Databasvärden eller pooler-användaren hittades inte.', action: 'POSTGRES_URL pekar på en värd/tenant som inte finns. Kopiera en aktuell anslutningsadress från den befintliga orderdatabasen.' }
  if (code === '28P01' || /password authentication failed/i.test(msg))
    return { kind: 'auth_failed', message: 'Databasen nekade inloggningen.', action: 'Uppdatera lösenordet i POSTGRES_URL för den befintliga databasen.' }
  if (code === 'ECONNREFUSED' || code === 'ETIMEDOUT' || /timeout|ECONNREFUSED/i.test(msg))
    return { kind: 'unreachable', message: 'Databasen svarar inte.', action: 'Kontrollera att databasen är igång och nåbar från driftmiljön.' }
  if (code === '42P01' || code === 'PGRST205' || /does not exist/i.test(msg))
    return { kind: 'schema_missing', message: 'En tabell eller kolumn saknas i den aktiva databasen.', action: 'Kör de befintliga migrationerna mot den aktiva databasen.' }
  if (code === 'PGRST202' || /hub_exec/i.test(msg))
    return { kind: 'cloud_driver_missing', message: 'Lovable Cloud-drivrutinen (hub_exec) saknas eller nekas.', action: 'Kör migrationen som skapar public.hub_exec.' }
  if (code === '42501' || /permission denied/i.test(msg))
    return { kind: 'permission_denied', message: 'Databasrollen saknar behörighet.', action: 'Ge serverrollen behörighet till hubbens tabeller.' }
  return { kind: 'unknown', message: 'Databasanropet misslyckades.', action: 'Se serverloggen för felkod.' }
}

/**
 * Secret-free identity of the active order database. Two deployments that
 * report the same fingerprint read the same data source.
 */
export async function datasourceFingerprint(sql: HubSql): Promise<{ fingerprint: string | null; applications: number }> {
  const rows = await sql<{ n: string; first_id: string | null }[]>`
    SELECT count(*)::text AS n,
           (SELECT id::text FROM public.project_applications ORDER BY created_at ASC, id ASC LIMIT 1) AS first_id
    FROM public.project_applications
  `
  const firstId = rows[0]?.first_id ?? null
  const n = Number(rows[0]?.n ?? 0)
  if (!firstId) return { fingerprint: null, applications: n }
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`dwp-hub:${firstId}`))
  const hex = Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('')
  return { fingerprint: hex.slice(0, 16), applications: n }
}
