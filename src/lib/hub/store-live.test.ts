import { describe, expect, test } from 'bun:test'
import { routeByRules } from '@/lib/revision/router'
import { hubSql, hubStore, withHubRead } from './db'
import { findApplication, listApplications } from './applications'
import { runRevisionJob } from './revise'

/**
 * Live verification against the ACTIVE hub store (opt-in: HUB_LIVE_TEST=1).
 * Uses a synthetic TEST- reference, mailAllowed=false (no customer mail) and
 * leaves the rows archived for audit — nothing is deleted.
 */
const live = process.env.HUB_LIVE_TEST === '1' && hubStore() !== 'none'

describe.skipIf(!live)('hub store live flow', () => {
  test('application -> lookup -> changes -> versions -> idempotency -> timeline -> mail log', async () => {
    const reference = `TEST-LIVE-${Date.now().toString(36).toUpperCase()}`
    const sql = hubSql()
    await sql`
      INSERT INTO public.project_applications (reference, name, email, phone, company, description, website_type, file_names, status)
      VALUES (${reference}, '[TEST] Live', 'test@example.invalid', '0000', '[TEST] Bohus Bil', 'Syntetiskt test av hela orderflödet.', 'företagssida', ${[]}, 'new')
    `
    const app = await withHubRead((s) => findApplication(s, reference))
    expect(app?.reference).toBe(reference)
    const list = await withHubRead(listApplications)
    expect(list.some((r: any) => r.reference === reference)).toBe(true)

    const reply = 'Lägg till mer blått och gör rubriken mindre.'
    const routed = routeByRules(reply)
    const [cr] = await sql`
      INSERT INTO public.customer_change_requests (reference, raw_text, message_id, matched_via, status, category)
      VALUES (${reference}, ${reply}, ${`<${reference}@test.invalid>`}, 'plus_address', 'received', ${routed.category})
      RETURNING id
    `
    const input = { app, changeRequestId: cr.id, directives: routed.extracted.directives, summary: routed.extracted.summary, origin: 'https://dinwebbpartner.com', mailAllowed: false }
    const out = await runRevisionJob(sql, input)
    expect(out.ok).toBe(true)
    expect(out.autoSent).toBeFalsy()
    const dup = await runRevisionJob(sql, input)
    expect(dup.duplicateJob).toBe(true)

    const versions = await sql`SELECT revision FROM public.design_versions WHERE reference = ${reference} ORDER BY revision`
    expect(versions.map((v: any) => v.revision)).toEqual([out.revision])
    const jobs = await sql`SELECT status FROM public.revision_jobs WHERE reference = ${reference}`
    expect(jobs).toHaveLength(1)
    const events = await sql`SELECT event_type FROM public.application_events WHERE reference = ${reference}`
    expect(events.length).toBeGreaterThan(0)
    const sent = await sql`SELECT status FROM public.preview_email_log WHERE reference = ${reference} AND status = 'sent'`
    expect(sent).toHaveLength(0)

    await sql`UPDATE public.project_applications SET status = 'archived' WHERE reference = ${reference}`
    await sql.end()
  }, 30000)
})
