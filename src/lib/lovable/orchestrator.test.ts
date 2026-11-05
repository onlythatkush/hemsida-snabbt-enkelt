import { describe, expect, it, vi } from 'vitest'
import { buildBrief, decide, fetchProjectMetadata, previewMatchesProject } from './orchestrator'

describe('lovable orchestrator', () => {
  it('reuses the existing project for repeat clicks', () => {
    expect(decide({ lovable_project_id: 'p1', locked_until: null })).toEqual({ kind: 'reuse', projectId: 'p1' })
  })
  it('never creates when another run holds the lock', () => {
    expect(decide({ lovable_project_id: null, locked_until: null }, Date.now(), false)).toEqual({ kind: 'locked' })
  })
  it('new order without project requires manual build (API cannot create)', () => {
    expect(decide(null)).toEqual({ kind: 'needs_manual_build' })
  })
  it('brief marks missing facts instead of inventing them', () => {
    const b = buildBrief({ reference: 'ORD-X1', company: 'Godislandet', phone: '' })
    expect(b).toContain('Företag: Godislandet')
    expect(b).toContain('Telefon: SAKNAS')
    expect(b).toContain('hitta inte på priser, öppettider')
  })
  it('preview must belong to same project', () => {
    const id = '45a285d5-3a58-4e1a-ba0a-b74a660dff3f'
    expect(previewMatchesProject(`https://id-preview--${id}.lovable.app`, id)).toBe(true)
    expect(previewMatchesProject('https://id-preview--other.lovable.app', id)).toBe(false)
  })
  it('returns configuration_required without secrets and never calls the API', async () => {
    delete process.env.LOVABLE_ACCOUNT_API_KEY
    const f = vi.fn()
    const r = await fetchProjectMetadata('x', f as any)
    expect(r).toMatchObject({ ok: false, status: 'configuration_required' })
    expect(f).not.toHaveBeenCalled()
  })
  it('surfaces real API errors instead of success', async () => {
    process.env.LOVABLE_API_KEY = 'a'; process.env.LOVABLE_ACCOUNT_API_KEY = 'b'
    const f = vi.fn(async () => new Response(JSON.stringify({ detail: 'nope', request_id: 'r1' }), { status: 403 }))
    const r = await fetchProjectMetadata('x', f as any)
    expect(r).toMatchObject({ ok: false, status: 'failed' })
    expect((r as any).error).toContain('403')
  })
})
