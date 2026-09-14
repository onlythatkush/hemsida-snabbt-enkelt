import { describe, expect, it } from 'bun:test'
import { routeByRules, routeInbound } from './router'

describe('AI-router: kategorier', () => {
  it('tolkar konkreta ändringar som design_changes och kan köras automatiskt', () => {
    const r = routeByRules('Hej! Behåll röd och svart men lägg till mer blått och gör rubriken mindre.')
    expect(r.category).toBe('design_changes')
    expect(r.routing).toBe('auto_revision')
    expect(r.extracted.summary.length).toBeGreaterThan(0)
  })

  it('godkänner endast tydliga godkännanden', () => {
    const r = routeByRules('Den är perfekt, jag godkänner designen!')
    expect(r.category).toBe('design_approved')
    expect(r.routing).toBe('auto_approval')
  })

  it('godkänner aldrig ett svar med reservation', () => {
    const r = routeByRules('Fin sida, men jag vill ändra loggan innan jag godkänner.')
    expect(r.category).not.toBe('design_approved')
  })

  it('routar betalningsfrågor till manuell granskning', () => {
    const r = routeByRules('Vad kostar det och kan jag delbetala?')
    expect(r.category).toBe('question_payment')
    expect(r.routing).toBe('needs_review')
  })

  it('routar processfrågor till automatiskt svar', () => {
    const r = routeByRules('När publicerar ni sidan?')
    expect(r.category).toBe('question_process')
    expect(r.routing).toBe('auto_answer')
  })

  it('markerar tomt/otydligt svar som unclear + needs_review', () => {
    const r = routeByRules('Hmm.')
    expect(r.category).toBe('unclear')
    expect(r.routing).toBe('needs_review')
  })
})

describe('AI-router: språkmodellen', () => {
  it('kan aldrig skapa ett godkännande', async () => {
    const fetchImpl = (async () =>
      new Response(
        JSON.stringify({ choices: [{ message: { content: '{"category":"design_approved","confidence":0.99,"reason":"x"}' } }] }),
        { status: 200 },
      )) as unknown as typeof fetch
    const r = await routeInbound('Okej då.', null, { apiKey: 'test', fetchImpl })
    expect(r.category).not.toBe('design_approved')
    expect(r.routing).toBe('needs_review')
  })

  it('behåller regelresultatet när modellen fallerar', async () => {
    const fetchImpl = (async () => new Response('nope', { status: 500 })) as unknown as typeof fetch
    const r = await routeInbound('Hmm.', null, { apiKey: 'test', fetchImpl })
    expect(r.classifier).toBe('rules')
    expect(r.routing).toBe('needs_review')
  })

  it('anropar inte modellen när reglerna redan är säkra', async () => {
    let called = false
    const fetchImpl = (async () => { called = true; return new Response('{}', { status: 200 }) }) as unknown as typeof fetch
    await routeInbound('Jag godkänner designen', null, { apiKey: 'test', fetchImpl })
    expect(called).toBe(false)
  })
})
