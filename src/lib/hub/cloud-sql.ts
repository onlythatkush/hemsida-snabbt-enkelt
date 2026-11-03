import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Minimal `postgres`-compatible tagged-template driver over Lovable Cloud.
 *
 * Every hub module is written against the `sql\`...\`` API. When the active
 * store is Lovable Cloud, this driver renders the statement with safely quoted
 * literals and executes it through `public.hub_exec`, which only service_role
 * may call and which only accepts SELECT/WITH/INSERT/UPDATE/DELETE. The
 * service-role key never leaves the server.
 */

class Json { constructor(public value: unknown) {} }
class Arr { constructor(public value: unknown[]) {} }
class Identifiers { constructor(public value: Record<string, unknown>) {} }
class Fragment { constructor(public text: string) {} }

export function quoteLiteral(v: unknown): string {
  if (v === null || v === undefined) return 'NULL'
  if (v instanceof Fragment) return v.text
  if (v instanceof Json) return `${quoteString(JSON.stringify(v.value ?? null))}::jsonb`
  if (v instanceof Arr) {
    if (!v.value.length) return `'{}'::text[]`
    return `ARRAY[${v.value.map(quoteLiteral).join(', ')}]`
  }
  if (typeof v === 'number') {
    if (!Number.isFinite(v)) throw new Error('hub sql: non-finite number')
    return String(v)
  }
  if (typeof v === 'bigint') return v.toString()
  if (typeof v === 'boolean') return v ? 'true' : 'false'
  if (v instanceof Date) return quoteString(v.toISOString())
  if (Array.isArray(v)) {
    if (!v.length) return `'{}'::text[]`
    return `ARRAY[${v.map(quoteLiteral).join(', ')}]`
  }
  if (typeof v === 'object') return `${quoteString(JSON.stringify(v))}::jsonb`
  return quoteString(String(v))
}

function quoteString(s: string): string {
  if (s.includes('\u0000')) throw new Error('hub sql: NUL byte in value')
  // hub_exec runs with standard_conforming_strings (Postgres default), so
  // doubling single quotes is the complete escaping rule.
  return `'${s.replace(/'/g, "''")}'`
}

function quoteIdent(name: string): string {
  if (!/^[a-z_][a-z0-9_]*$/i.test(name)) throw new Error(`hub sql: invalid identifier ${name}`)
  return `"${name}"`
}

export function renderSql(strings: TemplateStringsArray, values: unknown[]): { text: string; wantRows: boolean } {
  let text = strings[0]
  for (let i = 0; i < values.length; i++) {
    const v = values[i]
    if (v instanceof Identifiers) {
      // `UPDATE t SET ${sql(patch)}` form.
      text += Object.entries(v.value)
        .filter(([, val]) => val !== undefined)
        .map(([k, val]) => `${quoteIdent(k)} = ${quoteLiteral(val)}`)
        .join(', ')
    } else {
      text += quoteLiteral(v)
    }
    text += strings[i + 1]
  }
  // Decide on the statement skeleton only — never on user-supplied values.
  const skeleton = strings.join(' ')
  const wantRows = /^\s*(select|with)\b/i.test(skeleton) || /\breturning\b/i.test(skeleton)
  return { text, wantRows }
}

export function createCloudSql(client: SupabaseClient<any>) {
  const run = async (strings: TemplateStringsArray, ...values: unknown[]) => {
    const { text, wantRows } = renderSql(strings, values)
    const { data, error } = await client.rpc('hub_exec', { q: text, want_rows: wantRows })
    if (error) {
      const err: any = new Error(error.message)
      err.code = error.code
      throw err
    }
    const rows: any = Array.isArray(data) ? data : []
    rows.count = rows.length
    return rows
  }
  const sql: any = (first: any, ...rest: unknown[]) => {
    if (Array.isArray(first) && 'raw' in first) return run(first as TemplateStringsArray, ...rest)
    if (first && typeof first === 'object') return new Identifiers(first)
    throw new Error('hub sql: unsupported call')
  }
  sql.json = (v: unknown) => new Json(v)
  sql.array = (v: unknown[]) => new Arr(v)
  sql.end = async () => undefined
  sql.__cloud = true
  return sql
}
