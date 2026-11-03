import { afterEach, expect, test } from 'bun:test'
import { hubStore } from './cloud'

const KEYS = ['POSTGRES_URL', 'STORAGE_POSTGRES_URL', 'STORAGE_DATABASE_URL', 'DATABASE_URL', 'SUPABASE_DB_URL', 'SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY']
const saved = Object.fromEntries(KEYS.map((k) => [k, process.env[k]]))
function set(env: Record<string, string>) { for (const k of KEYS) delete process.env[k]; Object.assign(process.env, env) }
afterEach(() => { for (const k of KEYS) { if (saved[k] === undefined) delete process.env[k]; else process.env[k] = saved[k] } })

test('explicit external Postgres URL wins over Cloud', () => {
  set({ POSTGRES_URL: 'postgres://x', SUPABASE_URL: 'u', SUPABASE_SERVICE_ROLE_KEY: 'k' })
  expect(hubStore()).toBe('postgres')
})
test('Cloud is used instead of internal SUPABASE_DB_URL', () => {
  set({ SUPABASE_DB_URL: 'postgres://internal', SUPABASE_URL: 'u', SUPABASE_SERVICE_ROLE_KEY: 'k' })
  expect(hubStore()).toBe('cloud')
})
test('no configuration reports none (never fake success)', () => {
  set({})
  expect(hubStore()).toBe('none')
})
