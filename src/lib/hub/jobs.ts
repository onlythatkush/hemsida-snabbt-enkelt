import type { HubSql } from './db'

export type JobStatus = 'queued' | 'processing' | 'succeeded' | 'failed' | 'needs_review'

/**
 * Creates (or resumes) a revision job. The idempotency key makes a redelivered
 * webhook reuse the same job instead of creating a duplicate revision.
 * Returns null when a job with the same key already exists and is not retryable.
 */
export async function claimJob(
  sql: HubSql,
  input: { reference: string; changeRequestId?: string | null; idempotencyKey: string; kind?: string },
): Promise<{ id: string; retryCount: number } | null> {
  const rows = await sql<{ id: string; retry_count: number }[]>`
    INSERT INTO public.revision_jobs (reference, change_request_id, kind, status, idempotency_key, started_at)
    VALUES (${input.reference}, ${input.changeRequestId ?? null}, ${input.kind ?? 'design_revision'},
            'processing', ${input.idempotencyKey}, now())
    ON CONFLICT (idempotency_key) DO UPDATE
      SET status = 'processing',
          retry_count = public.revision_jobs.retry_count + 1,
          started_at = now(),
          last_error = NULL
      WHERE public.revision_jobs.status IN ('failed', 'queued', 'needs_review')
    RETURNING id, retry_count
  `
  if (!rows.length) return null
  return { id: rows[0]!.id, retryCount: rows[0]!.retry_count }
}

export async function finishJob(
  sql: HubSql,
  id: string,
  status: JobStatus,
  patch: { revision?: number | null; lastError?: string | null; detail?: Record<string, unknown> } = {},
) {
  await sql`
    UPDATE public.revision_jobs
    SET status = ${status},
        revision = ${patch.revision ?? null},
        last_error = ${patch.lastError ? String(patch.lastError).slice(0, 500) : null},
        detail = ${patch.detail ? sql.json(patch.detail as any) : null},
        finished_at = now()
    WHERE id = ${id}
  `
}
