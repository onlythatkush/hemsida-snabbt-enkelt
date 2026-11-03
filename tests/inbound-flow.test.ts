import { test } from 'node:test'
import assert from 'node:assert/strict'
import { routeByRules } from '../src/lib/revision/router.ts'
import { normalizeInbound } from '../src/lib/revision/inbound.ts'
import { matchInboundReference } from '../src/lib/revision/match.ts'

// Run with: npx tsx --test tests/inbound-flow.test.ts
// These tests exercise classification and matching without network or DB access.
test('Hotmail test: change request is actionable', () => {
  const routed = routeByRules('ändra bakgrund till mörkblå.', 'Test ändring TEST-001')
  assert.equal(routed.category, 'design_changes')
  assert.equal(routed.routing, 'auto_revision')
  assert.ok(routed.extracted.directives.addColors.length > 0)
})

test('explicit approval is accepted', () => {
  assert.equal(routeByRules('Jag godkänner hemsidan.').category, 'design_approved')
})

test('negated or conditional approval is never accepted', () => {
  for (const body of ['Inte godkänt ännu.', 'Ser bra ut?', 'Ser bra ut men ändra färgen.']) {
    assert.notEqual(routeByRules(body).category, 'design_approved')
  }
})

test('Resend envelope recipient matches the order', () => {
  const email = normalizeInbound({ data: {
    email_id: 'received-id',
    message_id: '<outlook-id>',
    received_for: ['reply+TEST-001@dinwebbpartner.com'],
    from: 'customer@example.net',
    subject: 'Test ändring TEST-001',
  } })
  assert.deepEqual(matchInboundReference(email), { reference: 'TEST-001', via: 'plus-address' })
})
