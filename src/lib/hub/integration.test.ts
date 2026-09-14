import { describe, expect, test } from 'bun:test'
import { REQUIRED_TABLES, schemaReport } from './db'
import { sendHubEmail } from './mail'
import { claimJob, finishJob } from './jobs'
import { runRevisionJob } from './revise'
import { routeByRules } from '@/lib/revision/router'
import { isMetadataOnly, normalizeInbound, resolveInboundEmail } from '@/lib/revision/inbound'
import { EMPTY_DIRECTIVES } from '@/lib/revision/types'

/** Minimal in-memory stand-in for the hub's Postgres connection. */
function makeSql(seed: Partial<{ columns: { table_name: string; column_name: string }[] }> = {}) {
  const state = {
    mails: [] as any[],
    mailKeys: new Set<string>(),
    jobs: new Map<string, { id: string; status: string; retry: number }>(),
    versions: [] as any[],
    events: [] as any[],
  }
  const sql: any = (strings: TemplateStringsArray, ...values: any[]) => {
    const text = strings.join(' ')
    if (text.includes('information_schema.columns')) return Promise.resolve(seed.columns ?? [])
    if (text.includes('INSERT INTO public.preview_email_log')) {
      const key = values[10]
      if (state.mailKeys.has(key)) return Promise.resolve([]) // idempotency key already used
      state.mailKeys.add(key)
      state.mails.push({ kind: values[7], key, recipient: values[2] })
      return Promise.resolve([{ id: `log-${state.mails.length}` }])
    }
    if (text.includes('INSERT INTO public.revision_jobs')) {
      const key = values[3]
      const existing = state.jobs.get(key)
      if (existing && !['failed', 'queued', 'needs_review'].includes(existing.status)) return Promise.resolve([])
      const retry = existing ? existing.retry + 1 : 0
      state.jobs.set(key, { id: key, status: 'processing', retry })
      return Promise.resolve([{ id: key, retry_count: retry }])
    }
    if (text.includes('UPDATE public.revision_jobs')) {
      const job = state.jobs.get(values[3])
      if (job) job.status = values[0]
      return Promise.resolve([])
    }
    if (text.includes('max(revision)')) {
      return Promise.resolve([{ max: state.versions.reduce((m, v) => Math.max(m, v), 0) }])
    }
    if (text.includes('INSERT INTO public.design_versions')) {
      const revision = values[1]
      if (state.versions.includes(revision)) return Promise.resolve([])
      state.versions.push(revision)
      return Promise.resolve([{ id: `v${revision}` }])
    }
    if (text.includes('INSERT INTO public.application_events')) {
      state.events.push(values[1])
      return Promise.resolve([])
    }
    return Promise.resolve([])
  }
  sql.json = (v: any) => v
  return { sql, state }
}

const app = {
  reference: 'ORD-INT001',
  name: 'Test Testsson',
  company: 'Bohus Bil',
  email: 'kund@bohusbil.se',
  phone: '0700000000',
  description: 'Uthyrning av premiumbilar i Göteborg.',
  website_type: 'företagssida',
  colors: 'svart',
  extra_requests: '',
  file_names: [] as string[],
  design_spec: null as any,
  design_revision: 0,
  design_locked: false,
  preview_token: 'b'.repeat(64),
}

describe('hub schema health', () => {
  test('a missing table is reported, never silently treated as ready', async () => {
    const { sql } = makeSql({ columns: [] })
    const report = await schemaReport(sql)
    expect(report.ready).toBe(false)
    for (const t of REQUIRED_TABLES) expect(report.tables[t]!.exists).toBe(false)
  })

  test('preview_email_log is part of the required schema', () => {
    expect(REQUIRED_TABLES).toContain('preview_email_log')
  })
})

describe('inbound hardening', () => {
  test('a metadata-only webhook triggers a body fetch before classification', async () => {
    const payload = { type: 'email.received', data: { email_id: 'em_123', from: 'kund@bohusbil.se', to: ['reply+ORD-INT001@reply.dinwebbpartner.com'] } }
    const normalized = normalizeInbound(payload)
    expect(isMetadataOnly(normalized)).toBe(true)

    const fetchImpl = (async () =>
      new Response(JSON.stringify({ id: 'em_123', text: 'Gör rubriken mindre tack', subject: 'Re: Din nya sida' }), {
        status: 200, headers: { 'content-type': 'application/json' },
      })) as unknown as typeof fetch

    const resolved = await resolveInboundEmail(payload, { apiKey: 'test-key', fetchImpl })
    expect(resolved.email.text).toContain('rubriken mindre')
    expect(resolved.fetched).toBe(true)
  })

  test('metadata-only without a fetchable body never guesses an intent', async () => {
    const payload = { type: 'email.received', data: { email_id: 'em_404', from: 'kund@bohusbil.se' } }
    const fetchImpl = (async () => new Response('nope', { status: 404 })) as unknown as typeof fetch
    const resolved = await resolveInboundEmail(payload, { apiKey: 'test-key', fetchImpl })
    expect((resolved.email.text || '').trim()).toBe('')
    expect(routeByRules(resolved.email.text || '').category).toBe('unclear')
  })
})

describe('question routing', () => {
  test('process questions can be answered automatically', () => {
    const routed = routeByRules('Hej, när är sidan klar?')
    expect(routed.category).toBe('question_process')
    expect(routed.routing).not.toBe('auto_revision')
  })

  test('payment questions always go to manual review', () => {
    const routed = routeByRules('Vad kostar det och hur betalar jag?')
    expect(routed.category).toBe('question_payment')
    expect(routed.routing).toBe('needs_review')
  })
})

describe('idempotency and retry', () => {
  test('the same idempotency key never mails a customer twice', async () => {
    const { sql, state } = makeSql()
    const first = await sendHubEmail(sql, {
      reference: app.reference, kind: 'question_ack', templateKey: 'question-ack',
      data: { heading: 'Tack', intro: 'Vi återkommer.', reference: app.reference },
      recipient: app.email, idempotencyKey: 'ack-1',
    })
    const second = await sendHubEmail(sql, {
      reference: app.reference, kind: 'question_ack', templateKey: 'question-ack',
      data: { heading: 'Tack', intro: 'Vi återkommer.', reference: app.reference },
      recipient: app.email, idempotencyKey: 'ack-1',
    })
    expect(first.sent).toBe(false) // no RESEND_API_KEY in tests
    expect(second.duplicate).toBe(true)
    expect(state.mails).toHaveLength(1)
  })

  test('a duplicate webhook cannot create a second revision job', async () => {
    const { sql } = makeSql()
    const a = await claimJob(sql, { reference: app.reference, idempotencyKey: 'revision-cr-9' })
    expect(a).not.toBeNull()
    await finishJob(sql, a!.id, 'succeeded')
    const b = await claimJob(sql, { reference: app.reference, idempotencyKey: 'revision-cr-9' })
    expect(b).toBeNull()
  })

  test('a failed job can be retried and counts the attempt', async () => {
    const { sql } = makeSql()
    const a = await claimJob(sql, { reference: app.reference, idempotencyKey: 'revision-cr-10' })
    await finishJob(sql, a!.id, 'failed', { lastError: 'boom' })
    const b = await claimJob(sql, { reference: app.reference, idempotencyKey: 'revision-cr-10' })
    expect(b).not.toBeNull()
    expect(b!.retryCount).toBe(1)
  })

  test('retrying a revision reuses the job and never duplicates a version', async () => {
    const { sql, state } = makeSql()
    const first = await runRevisionJob(sql, {
      app, changeRequestId: 'cr-11', directives: { ...EMPTY_DIRECTIVES },
      summary: [], origin: 'https://dinwebbpartner.com', mailAllowed: true,
    })
    expect(first.revision).toBe(1)
    const retry = await runRevisionJob(sql, {
      app, changeRequestId: 'cr-11', directives: { ...EMPTY_DIRECTIVES },
      summary: [], origin: 'https://dinwebbpartner.com', mailAllowed: true, source: 'retry', sendAck: false,
    })
    expect(retry.duplicateJob).toBe(true)
    expect(state.versions).toEqual([1])
  })
})
