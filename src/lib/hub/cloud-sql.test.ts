import { describe, expect, test } from 'bun:test'
import { quoteLiteral, renderSql } from './cloud-sql'

const t = (s: TemplateStringsArray, ...v: unknown[]) => renderSql(s, v)

describe('cloud sql driver', () => {
  test('escapes quotes so customer text can never break out of a literal', () => {
    const evil = "x'); DELETE FROM public.project_applications; --"
    const { text } = t`SELECT * FROM public.project_applications WHERE reference = ${evil}`
    expect(text).toBe("SELECT * FROM public.project_applications WHERE reference = 'x''); DELETE FROM public.project_applications; --'")
  })
  test('rows mode is decided by the statement, not by customer values', () => {
    expect(t`INSERT INTO public.application_events (label) VALUES (${'returning soon'})`.wantRows).toBe(false)
    expect(t`UPDATE public.revision_jobs SET status = ${'x'} WHERE id = ${'1'} RETURNING id`.wantRows).toBe(true)
    expect(t`SELECT 1`.wantRows).toBe(true)
  })
  test('null, numbers, booleans, arrays and json render as typed literals', () => {
    expect(quoteLiteral(null)).toBe('NULL')
    expect(quoteLiteral(3)).toBe('3')
    expect(quoteLiteral(false)).toBe('false')
    expect(quoteLiteral([])).toBe("'{}'::text[]")
    expect(quoteLiteral(['a', "b'c"])).toBe("ARRAY['a', 'b''c']")
    expect(quoteLiteral({ a: "it's" })).toBe(`'{"a":"it''s"}'::jsonb`)
  })
  test('rejects NUL bytes and non-finite numbers', () => {
    expect(() => quoteLiteral('a\u0000b')).toThrow()
    expect(() => quoteLiteral(Number.NaN)).toThrow()
  })
})
