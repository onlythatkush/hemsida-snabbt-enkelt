import { describe, expect, test } from 'bun:test'
import { referenceFromSource } from './contact-ref'

describe('referenceFromSource', () => {
  test('extracts the order number from the order form source', () => {
    expect(referenceFromSource('Ny projektansökan (ORD-K645BV)', 'x')).toBe('ORD-K645BV')
  })
  test('normalises case', () => {
    expect(referenceFromSource('ny projektansökan (ord-k645bv)', 'x')).toBe('ORD-K645BV')
  })
  test('falls back to a stable KONTAKT id for plain contact forms', () => {
    expect(referenceFromSource('Kontaktformulär', '1234abcd-0000-0000-0000-000000000000')).toBe('KONTAKT-1234ABCD')
    expect(referenceFromSource(undefined, 'abcd1234-0000')).toBe('KONTAKT-ABCD1234')
  })
})
