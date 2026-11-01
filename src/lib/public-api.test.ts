import { describe, expect, test } from 'bun:test'
import { publicApiUrl, resolvePublicApiBase } from './public-api'

describe('one deployed application origin', () => {
  test('orders and confirmation stay on dinwebbpartner.com by default', () => {
    expect(resolvePublicApiBase()).toBe('')
    expect(publicApiUrl('/api/public/application')).toBe('/api/public/application')
  })
  test('only an explicit deployment override selects an alternate backend', () => {
    expect(resolvePublicApiBase(' https://example.com/ ')).toBe('https://example.com')
    expect(resolvePublicApiBase(' ')).toBe('')
  })
})