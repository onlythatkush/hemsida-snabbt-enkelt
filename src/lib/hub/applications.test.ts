import { describe, expect, test } from 'bun:test'
import type { HubSql } from './db'
import { findApplication, listApplications } from './applications'

describe('authoritative application reads', () => {
  test('returns rows from the provided submission connection', async () => {
    const rows = [{ reference: 'ORD-OS19FK' }]
    const sql = (async () => rows) as unknown as HubSql
    const result = await listApplications(sql)
    expect(Array.from(result)).toEqual(rows)
  })
  test('connection failure is not converted into zero applications', async () => {
    const sql = (async () => { throw new Error('ENOTFOUND') }) as unknown as HubSql
    await expect(listApplications(sql)).rejects.toThrow('ENOTFOUND')
    await expect(findApplication(sql, 'ORD-OS19FK')).rejects.toThrow('ENOTFOUND')
  })
  test('matches the exact normalized reference without alternate data sources', async () => {
    let lookup: unknown
    const sql = (async (_: TemplateStringsArray, ref: unknown) => {
      lookup = ref
      return [{ reference: 'ORD-3M8NUN' }]
    }) as unknown as HubSql
    expect((await findApplication(sql, ' ord-3m8nun '))?.reference).toBe('ORD-3M8NUN')
    expect(lookup).toBe('ORD-3M8NUN')
  })
})