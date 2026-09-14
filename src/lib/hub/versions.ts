import type { HubSql } from './db'

/**
 * Immutable design history. Each generated revision is appended once; existing
 * rows are never overwritten, so the full loop can be replayed and audited.
 */
export async function recordDesignVersion(
  sql: HubSql,
  input: {
    reference: string
    revision: number
    designSpec: unknown
    designFamily?: string | null
    designVersion?: number | null
    previewUrl?: string | null
    qaStatus?: string | null
    qaScore?: number | null
    qaReport?: unknown
    source: 'admin' | 'customer_reply' | 'retry'
    changeRequestId?: string | null
  },
): Promise<{ stored: boolean }> {
  const rows = await sql<{ id: string }[]>`
    INSERT INTO public.design_versions
      (reference, revision, design_spec, design_family, design_version, preview_url,
       qa_status, qa_score, qa_report, source, change_request_id)
    VALUES (${input.reference}, ${input.revision}, ${sql.json(input.designSpec as any)},
            ${input.designFamily ?? null}, ${input.designVersion ?? null}, ${input.previewUrl ?? null},
            ${input.qaStatus ?? null}, ${input.qaScore ?? null},
            ${input.qaReport ? sql.json(input.qaReport as any) : null},
            ${input.source}, ${input.changeRequestId ?? null})
    ON CONFLICT (reference, revision) DO NOTHING
    RETURNING id
  `
  return { stored: rows.length > 0 }
}

/** Next revision number, derived from the immutable history first. */
export async function nextRevision(sql: HubSql, reference: string, appFallback: number): Promise<number> {
  const rows = await sql<{ max: number | null }[]>`
    SELECT max(revision) AS max FROM public.design_versions WHERE reference = ${reference}
  `
  const fromHistory = Number(rows[0]?.max ?? 0)
  return Math.max(fromHistory, appFallback) + 1
}

export async function listVersions(sql: HubSql, reference: string) {
  return sql`
    SELECT revision, design_family, preview_url, qa_status, qa_score, source, created_at
    FROM public.design_versions WHERE reference = ${reference} ORDER BY revision DESC LIMIT 50
  `
}
