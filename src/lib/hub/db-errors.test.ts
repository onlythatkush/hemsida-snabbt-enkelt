import { expect, test } from 'bun:test'
import { classifyDbError } from './db'

test('Vercel pooler tenant error is reported as host_not_found', () => {
  expect(classifyDbError(new Error('getaddrinfo ENOTFOUND db.example')).kind).toBe('host_not_found')
  expect(classifyDbError({ message: 'Tenant or user postgres.dr123 not found' }).kind).toBe('unknown')
  expect(classifyDbError({ message: 'tenant/user postgres.dr123 not found' }).kind).toBe('host_not_found')
})
test('auth, missing table and missing cloud driver are distinguished', () => {
  expect(classifyDbError({ code: '28P01' }).kind).toBe('auth_failed')
  expect(classifyDbError({ code: 'PGRST205' }).kind).toBe('schema_missing')
  expect(classifyDbError({ code: 'PGRST202', message: 'Could not find the function public.hub_exec' }).kind).toBe('cloud_driver_missing')
})
test('diagnostics never echo the raw error text (could contain a connection string)', () => {
  const info = classifyDbError(new Error('connect postgres://user:secret@host/db failed'))
  expect(JSON.stringify(info)).not.toContain('secret')
})
