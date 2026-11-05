/**
 * Order-linked Lovable build orchestration.
 *
 * Truth rules:
 * - One Lovable project per order. Repeat clicks / revisions reuse the stored project.
 * - A per-order lease lock (locked_until) prevents concurrent duplicate builds.
 * - The public Lovable API (api.lovable.dev, via the connector gateway) can READ and
 *   manage projects but cannot create projects or send build prompts. We therefore
 *   never claim a build ran: without an association we return `manual_build_required`
 *   with the prepared brief. With an association we refresh real metadata from the API.
 * - Nothing here sends email or publishes.
 */
import type { HubSql } from '@/lib/hub/db'

export type BuildStatus =
  | 'brief_ready'            // brief stored, waiting for a human to build in Lovable
  | 'manual_build_required'  // API cannot create/build; human action required
  | 'configuration_required' // connector secrets missing for reading project metadata
  | 'associated'             // project linked to the order, metadata verified/stored
  | 'failed'

export type LovableBuildRow = {
  reference: string
  lovable_project_id: string | null
  lovable_commit: string | null
  preview_url: string | null
  status: BuildStatus
  design_brief: string | null
  design_metadata: Record<string, unknown>
  file_manifest: unknown[]
  files_source: 'none' | 'manual_manifest' | 'source_archive'
  attempt_count: number
  last_error: string | null
  locked_until: string | null
  created_at: string
  updated_at: string
}

export const ASSOCIATION_SCHEMA = {
  projectId: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
  commit: /^[a-f0-9]{40}$/,
}

/** Preview URL must belong to the same Lovable project id (prevents cross-linking). */
export function previewMatchesProject(previewUrl: string, projectId: string): boolean {
  try {
    const u = new URL(previewUrl)
    return u.protocol === 'https:' && u.hostname === `id-preview--${projectId}.lovable.app`
  } catch { return false }
}

type OrderLike = {
  reference: string; company?: string | null; description?: string | null; website_type?: string | null
  colors?: string | null; extra_requests?: string | null; social_links?: string | null
  address?: string | null; email?: string | null; phone?: string | null; file_names?: unknown
}

/** Deterministic brief built ONLY from the order. Missing facts are marked, never invented. */
export function buildBrief(app: OrderLike): string {
  const fact = (label: string, v: unknown) =>
    `- ${label}: ${typeof v === 'string' && v.trim() ? v.trim() : 'SAKNAS – hitta inte på, utelämna'}`
  const files = Array.isArray(app.file_names) ? (app.file_names as string[]) : []
  return [
    `Bygg en svensk webbplats för ordern ${app.reference}.`,
    '',
    'Kundfakta (använd exakt, ändra inte):',
    fact('Företag', app.company),
    fact('Typ av webbplats', app.website_type),
    fact('Telefon', app.phone),
    fact('E-post', app.email),
    fact('Adress', app.address),
    fact('Sociala länkar', app.social_links),
    fact('Färgönskemål', app.colors),
    '',
    'Kundens beskrivning:',
    (app.description || '').trim() || 'SAKNAS',
    '',
    'Extra önskemål:',
    (app.extra_requests || '').trim() || 'Inga',
    '',
    `Kunduppladdade filer (${files.length}): ${files.join(', ') || 'inga'}`,
    '',
    'Regler: hitta inte på priser, öppettider, omdömen, utmärkelser eller kontaktuppgifter.',
    'Inga kontaktformulär som låtsas skicka. All text på svenska. Mobil först.',
  ].join('\n')
}

export type Decision =
  | { kind: 'locked' }
  | { kind: 'reuse'; projectId: string }
  | { kind: 'needs_manual_build' }

/** Pure decision: never create a second project for an order that already has one. */
export function decide(row: Pick<LovableBuildRow, 'lovable_project_id' | 'locked_until'> | null, now = Date.now(), lockAcquired = true): Decision {
  if (!lockAcquired) return { kind: 'locked' }
  if (row?.lovable_project_id) return { kind: 'reuse', projectId: row.lovable_project_id }
  return { kind: 'needs_manual_build' }
}

export function connectorConfigured() {
  return Boolean(process.env.LOVABLE_API_KEY && process.env.LOVABLE_ACCOUNT_API_KEY)
}

/** Real read of project metadata via the Lovable API connector. Never fabricates. */
export async function fetchProjectMetadata(projectId: string, fetchImpl: typeof fetch = fetch) {
  const key = process.env.LOVABLE_API_KEY, conn = process.env.LOVABLE_ACCOUNT_API_KEY
  if (!key || !conn) return { ok: false as const, status: 'configuration_required' as const, error: 'LOVABLE_API_KEY/LOVABLE_ACCOUNT_API_KEY saknas på servern' }
  const res = await fetchImpl(`https://connector-gateway.lovable.dev/lovable_account/v1/projects/${projectId}`, {
    headers: { Authorization: `Bearer ${key}`, 'X-Connection-Api-Key': conn, 'Lovable-Version': '2026-09-11' },
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({} as any))
    return { ok: false as const, status: 'failed' as const, error: `Lovable API ${res.status}: ${body.detail || body.title || res.statusText}${body.request_id ? ' (request ' + body.request_id + ')' : ''}` }
  }
  const p = await res.json() as Record<string, unknown>
  return { ok: true as const, project: {
    id: p.id, display_name: p.display_name, is_published: p.is_published,
    published_url: p.published_url ?? null, updated_at: p.updated_at ?? null,
  } }
}

const LOCK_SECONDS = 120

export async function getBuild(sql: HubSql, reference: string): Promise<LovableBuildRow | null> {
  const rows = await sql`SELECT * FROM public.lovable_builds WHERE reference=${reference} LIMIT 1`
  return (rows[0] as any) ?? null
}

/** Atomic per-order lease. Returns the row if acquired, null if another run holds it. */
export async function acquireLock(sql: HubSql, reference: string): Promise<LovableBuildRow | null> {
  await sql`INSERT INTO public.lovable_builds (reference) VALUES (${reference}) ON CONFLICT (reference) DO NOTHING`
  const rows = await sql`
    UPDATE public.lovable_builds SET locked_until = now() + make_interval(secs => ${LOCK_SECONDS}),
      attempt_count = attempt_count + 1, updated_at = now()
    WHERE reference=${reference} AND (locked_until IS NULL OR locked_until < now())
    RETURNING *`
  return (rows[0] as any) ?? null
}

export async function finish(sql: HubSql, reference: string, patch: { status: BuildStatus; brief?: string; metadata?: Record<string, unknown>; error?: string | null }) {
  const rows = await sql`
    UPDATE public.lovable_builds SET status=${patch.status},
      design_brief = COALESCE(${patch.brief ?? null}, design_brief),
      design_metadata = design_metadata || ${sql.json((patch.metadata ?? {}) as any)},
      last_error=${patch.error ?? null}, locked_until=NULL, updated_at=now()
    WHERE reference=${reference} RETURNING *`
  await sql`INSERT INTO public.application_events (reference, event_type, label, details)
    VALUES (${reference}, ${'lovable_build_' + patch.status}, ${'Lovable: ' + patch.status}, ${sql.json({ error: patch.error ?? null } as any)})`
    .catch(() => undefined)
  return rows[0] as any as LovableBuildRow
}

/** Main entry for the "Generera Lovable-demo" button. */
export async function orchestrate(sql: HubSql, app: OrderLike, fetchImpl: typeof fetch = fetch) {
  const locked = await acquireLock(sql, app.reference)
  const d = decide(locked, Date.now(), Boolean(locked))
  if (d.kind === 'locked') {
    return { httpStatus: 409, body: { status: 'locked', message: 'En Lovable-körning pågår redan för ordern. Vänta och försök igen.', build: await getBuild(sql, app.reference) } }
  }
  const brief = buildBrief(app)
  try {
    if (d.kind === 'reuse') {
      const meta = await fetchProjectMetadata(d.projectId, fetchImpl)
      if (!meta.ok) {
        const build = await finish(sql, app.reference, { status: meta.status, brief, error: meta.error })
        return { httpStatus: meta.status === 'configuration_required' ? 503 : 502, body: { status: meta.status, message: meta.error, build } }
      }
      const build = await finish(sql, app.reference, { status: 'associated', brief, metadata: { lovableProject: meta.project, verifiedAt: new Date().toISOString() } })
      return { httpStatus: 200, body: { status: 'associated', message: 'Befintligt Lovable-projekt återanvänt och verifierat. Inget nytt projekt skapades.', build } }
    }
    const build = await finish(sql, app.reference, {
      status: 'manual_build_required', brief,
      error: 'Lovables publika API kan inte skapa projekt eller skicka byggprompter. Bygg i Lovable-editorn med briefen och koppla sedan projektet till ordern.',
    })
    return { httpStatus: 202, body: { status: 'manual_build_required', message: build.last_error, build } }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    const build = await finish(sql, app.reference, { status: 'failed', brief, error: msg }).catch(() => null)
    return { httpStatus: 502, body: { status: 'failed', message: msg, build } }
  }
}

/** Admin-controlled one-time association. Dry-run unless confirm=true. Never overwrites a different project. */
export async function associate(sql: HubSql, input: { reference: string; projectId: string; commit: string; previewUrl: string; files?: unknown[]; confirm: boolean }) {
  if (!ASSOCIATION_SCHEMA.projectId.test(input.projectId) || !ASSOCIATION_SCHEMA.commit.test(input.commit) || !previewMatchesProject(input.previewUrl, input.projectId)) {
    return { httpStatus: 400, body: { error: 'Ogiltigt projekt-ID, commit eller preview-URL (preview måste tillhöra samma projekt).' } }
  }
  const current = await getBuild(sql, input.reference)
  if (current?.lovable_project_id && current.lovable_project_id !== input.projectId) {
    return { httpStatus: 409, body: { error: 'Ordern är redan kopplad till ett annat Lovable-projekt. Ingen ändring gjordes.', build: current } }
  }
  const plan = { reference: input.reference, projectId: input.projectId, commit: input.commit, previewUrl: input.previewUrl, filesCount: input.files?.length ?? 0 }
  if (!input.confirm) return { httpStatus: 200, body: { dryRun: true, wouldWrite: plan, existing: current } }
  await sql`INSERT INTO public.lovable_builds (reference) VALUES (${input.reference}) ON CONFLICT (reference) DO NOTHING`
  const rows = await sql`
    UPDATE public.lovable_builds SET lovable_project_id=${input.projectId}, lovable_commit=${input.commit},
      preview_url=${input.previewUrl}, status='associated',
      file_manifest = CASE WHEN ${input.files ? true : false} THEN ${sql.json((input.files ?? []) as any)} ELSE file_manifest END,
      files_source = CASE WHEN ${input.files ? true : false} THEN 'manual_manifest' ELSE files_source END,
      last_error=NULL, updated_at=now()
    WHERE reference=${input.reference} AND (lovable_project_id IS NULL OR lovable_project_id=${input.projectId})
    RETURNING *`
  if (!rows.length) return { httpStatus: 409, body: { error: 'Samtidig koppling upptäcktes; ingen ändring gjordes.' } }
  await sql`INSERT INTO public.application_events (reference, event_type, label, details)
    VALUES (${input.reference}, 'lovable_project_associated', 'Lovable-projekt kopplat till ordern', ${sql.json(plan as any)})`.catch(() => undefined)
  return { httpStatus: 200, body: { dryRun: false, build: rows[0] } }
}
