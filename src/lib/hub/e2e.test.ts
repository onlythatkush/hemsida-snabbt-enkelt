import { describe, expect, test } from 'bun:test'
import { composeDesignSpec } from '@/lib/design/compose'
import { routeByRules } from '@/lib/revision/router'
import { runRevisionJob } from './revise'

/**
 * Synthetic end-to-end run of the hub loop with an in-memory database double:
 * application -> preview -> customer reply (changes) -> revision job -> QA ->
 * new immutable version -> customer reply (approved).
 *
 * No provider call is made: without RESEND_API_KEY the mail layer reports
 * "not sent" instead of contacting Resend, so no customer can ever be mailed
 * from a test run.
 */
function makeSql() {
  const state = {
    jobs: new Map<string, { id: string; status: string; retry: number }>(),
    versions: [] as any[],
    events: [] as any[],
    mails: [] as any[],
    updates: [] as string[],
  }

  const sql: any = (strings: TemplateStringsArray, ...values: any[]) => {
    const text = strings.join(' ')
    if (text.includes('INSERT INTO public.revision_jobs')) {
      const key = values[3]
      const existing = state.jobs.get(key)
      if (existing && !['failed', 'queued', 'needs_review'].includes(existing.status)) {
        return Promise.resolve([]) // duplicate delivery -> no second revision
      }
      const retry = existing ? existing.retry + 1 : 0
      state.jobs.set(key, { id: key, status: 'processing', retry })
      return Promise.resolve([{ id: key, retry_count: retry }])
    }
    if (text.includes('max(revision)')) {
      const max = state.versions.reduce((m, v) => Math.max(m, v.revision), 0)
      return Promise.resolve([{ max }])
    }
    if (text.includes('INSERT INTO public.design_versions')) {
      const revision = values[1]
      if (state.versions.some((v) => v.revision === revision)) return Promise.resolve([])
      state.versions.push({ revision, spec: values[2], family: values[3], qa: values[6] })
      return Promise.resolve([{ id: `v${revision}` }])
    }
    if (text.includes('UPDATE public.revision_jobs')) {
      const job = [...state.jobs.values()].find((j) => j.id === values[3])
      if (job) job.status = values[0]
      return Promise.resolve([])
    }
    if (text.includes('INSERT INTO public.application_events')) {
      state.events.push({ type: values[1], label: values[2] })
      return Promise.resolve([])
    }
    if (text.includes('INSERT INTO public.preview_email_log')) {
      state.mails.push({ kind: values[1], key: values[8] })
      return Promise.resolve([{ id: `m${state.mails.length}` }])
    }
    if (text.includes('UPDATE')) state.updates.push(text)
    return Promise.resolve([])
  }
  sql.json = (v: any) => v
  return { sql, state }
}

const application = {
  reference: 'ORD-E2E001',
  name: 'Anna Karlsson',
  company: 'Bohus Bil & Uthyrning',
  email: 'anna@bohusbil.se',
  phone: '0700000000',
  address: 'Kungsgatan 1, Göteborg',
  description: 'Vi hyr ut premiumbilar till företag och privatpersoner i Göteborg.',
  website_type: 'företagssida',
  colors: 'svart och rött',
  extra_requests: 'Tydlig bokningsknapp',
  social_links: '',
  file_names: [] as string[],
  design_spec: null as any,
  design_revision: 0,
  design_locked: false,
  preview_token: 'a'.repeat(64),
}

describe('hub end-to-end (synthetic, no real mail)', () => {
  test('application -> preview -> changes -> new version -> approval', async () => {
    // 1) First preview from the application itself.
    const first = composeDesignSpec(application as any, { revision: 1 })
    expect(first.family).toBeTruthy()
    expect(['ready', 'review', 'blocked']).toContain(first.qa!.status)

    // 2) Customer replies asking for changes.
    const reply = 'Hej! Behåll svart och rött men lägg till mer blått och gör rubriken mindre.'
    const routed = routeByRules(reply)
    expect(routed.category).toBe('design_changes')
    expect(routed.extracted.addColors.length).toBeGreaterThan(0)
    expect(routed.extracted.headingScale).toBeLessThan(1)

    // 3) Revision job produces a real new version.
    const { sql, state } = makeSql()
    const out = await runRevisionJob(sql, {
      app: application,
      changeRequestId: 'cr-1',
      directives: routed.extracted,
      summary: routed.extracted.summary,
      origin: 'https://dinwebbpartner.com',
      mailAllowed: true,
      source: 'customer_reply',
    })
    expect(out.ok).toBe(true)
    expect(out.revision).toBe(1)
    expect(state.versions).toHaveLength(1)
    expect(out.qaStatus).toBeTruthy()
    // No provider key in tests -> nothing was actually sent to a customer.
    expect(out.autoSent).toBe(false)

    // 4) The same webhook delivered twice must not create a second version.
    const again = await runRevisionJob(sql, {
      app: application,
      changeRequestId: 'cr-1',
      directives: routed.extracted,
      summary: routed.extracted.summary,
      origin: 'https://dinwebbpartner.com',
      mailAllowed: true,
    })
    expect(again.duplicateJob).toBe(true)
    expect(state.versions).toHaveLength(1)

    // 5) A follow-up change request creates version 2, never overwriting v1.
    const second = await runRevisionJob(sql, {
      app: application,
      changeRequestId: 'cr-2',
      directives: routeByRules('Gör den mörkare tack').extracted,
      summary: ['mörkt läge'],
      origin: 'https://dinwebbpartner.com',
      mailAllowed: true,
    })
    expect(second.revision).toBe(2)
    expect(state.versions.map((v) => v.revision)).toEqual([1, 2])

    // 6) Explicit approval is the only thing that ends the loop.
    expect(routeByRules('Perfekt, jag godkänner designen!').category).toBe('design_approved')
    expect(routeByRules('Hmm, jag vet inte riktigt').category).not.toBe('design_approved')
  })
})
