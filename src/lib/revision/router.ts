import { classifyReply, type ReplyIntent } from './intent'
import { parseRevisionRequest } from './parse'
import type { RevisionDirectives } from './types'

/**
 * AI router for inbound customer replies.
 *
 * Safety contract:
 *  - A reply is only ever routed as an approval by the deterministic rule
 *    engine, on an explicit approval with no reservation. The language model
 *    can never produce `design_approved` on its own.
 *  - Anything with low confidence becomes `needs_review`.
 */

export type ReplyCategory =
  | 'design_changes'
  | 'design_approved'
  | 'question_design'
  | 'question_process'
  | 'question_payment'
  | 'question_other'
  | 'unclear'

export type Routing = 'auto_revision' | 'auto_approval' | 'auto_answer' | 'needs_review'

export type RouterResult = {
  category: ReplyCategory
  /** Legacy three-way intent kept for the existing admin UI and storage. */
  intent: ReplyIntent
  confidence: number
  reason: string
  classifier: 'rules' | 'rules+ai'
  signals: string[]
  routing: Routing
  extracted: {
    directives: RevisionDirectives
    summary: string[]
    questions: string[]
  }
}

const PAYMENT_WORDS = ['pris', 'priset', 'kostar', 'kostnad', 'betal', 'faktura', 'moms', 'avgift', 'delbetal', 'månadskostnad']
const PROCESS_WORDS = ['när', 'hur lång tid', 'leverans', 'publicera', 'publicering', 'lansera', 'domän', 'nästa steg', 'hur går', 'tidsplan', 'status']
const DESIGN_QUESTION_WORDS = ['går det att', 'kan man', 'kan ni lägga', 'hur ser', 'vilken font', 'vilket typsnitt', 'vilka färger', 'mobil']
const QUESTION_MARKERS = ['?', 'undrar', 'en fråga', 'kan ni berätta', 'vet ni']

const LOW_CONFIDENCE = 0.7

function norm(raw: string | null | undefined) {
  return ` ${(raw || '').toLowerCase().replace(/\s+/g, ' ').trim()} `
}

function extractQuestions(raw: string): string[] {
  return (raw || '')
    .split(/(?<=[?.!])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.includes('?'))
    .slice(0, 5)
}

function questionCategory(text: string): ReplyCategory | null {
  const hasQuestion = QUESTION_MARKERS.some((m) => text.includes(m))
  if (!hasQuestion) return null
  if (PAYMENT_WORDS.some((w) => text.includes(w))) return 'question_payment'
  if (PROCESS_WORDS.some((w) => text.includes(w))) return 'question_process'
  if (DESIGN_QUESTION_WORDS.some((w) => text.includes(w))) return 'question_design'
  return 'question_other'
}

/** Deterministic first pass — no network, fully testable. */
export function routeByRules(raw: string | null | undefined, subject?: string | null): RouterResult {
  const body = String(raw || '')
  const text = norm(`${body} ${subject || ''}`)
  const base = classifyReply(body)
  const directives = parseRevisionRequest(body)
  const questions = extractQuestions(body)
  const qCategory = questionCategory(text)

  const extracted = { directives, summary: directives.summary, questions }

  if (base.intent === 'changes') {
    const actionable = !directives.unparsed
    return {
      category: 'design_changes',
      intent: 'changes',
      confidence: actionable ? 0.9 : 0.62,
      reason: actionable
        ? 'Kunden ber om konkreta ändringar som kunde tolkas'
        : 'Kunden verkar be om ändringar men de kunde inte tolkas säkert',
      classifier: 'rules',
      signals: base.signals,
      routing: actionable ? 'auto_revision' : 'needs_review',
      extracted,
    }
  }

  if (base.intent === 'approved') {
    return {
      category: 'design_approved',
      intent: 'approved',
      confidence: 0.95,
      reason: base.reason,
      classifier: 'rules',
      signals: base.signals,
      routing: 'auto_approval',
      extracted,
    }
  }

  if (qCategory) {
    const confidence = qCategory === 'question_other' ? 0.55 : 0.75
    return {
      category: qCategory,
      intent: 'unclear',
      confidence,
      reason: 'Kunden ställer en fråga',
      classifier: 'rules',
      signals: questions.slice(0, 3),
      // Payment/delivery is not live yet — always a human.
      routing: qCategory === 'question_payment' || confidence < LOW_CONFIDENCE ? 'needs_review' : 'auto_answer',
      extracted,
    }
  }

  return {
    category: 'unclear',
    intent: 'unclear',
    confidence: 0.3,
    reason: base.reason,
    classifier: 'rules',
    signals: base.signals,
    routing: 'needs_review',
    extracted,
  }
}

type AiOptions = { fetchImpl?: typeof fetch; apiKey?: string; model?: string }

const AI_CATEGORIES: ReplyCategory[] = [
  'design_changes', 'question_design', 'question_process', 'question_payment', 'question_other', 'unclear',
]

/**
 * Optional second pass. Only runs when the rules were unsure, can never turn a
 * reply into an approval, and silently keeps the rule result on any failure.
 */
export async function routeInbound(
  raw: string | null | undefined,
  subject?: string | null,
  opts: AiOptions = {},
): Promise<RouterResult> {
  const rules = routeByRules(raw, subject)
  if (rules.confidence >= LOW_CONFIDENCE || rules.category === 'design_approved') return rules

  const apiKey = opts.apiKey ?? process.env.LOVABLE_API_KEY
  const body = String(raw || '').trim()
  if (!apiKey || !body) return rules

  const doFetch = opts.fetchImpl ?? fetch
  try {
    const res = await doFetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: opts.model ?? 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content:
              'Du klassificerar svenska kundsvar på ett designförslag. Svara ENDAST med JSON: ' +
              '{"category":"design_changes|question_design|question_process|question_payment|question_other|unclear",' +
              '"confidence":0-1,"reason":"kort svensk motivering"}. ' +
              'Godkännanden får du aldrig klassificera – använd unclear om svaret verkar vara ett godkännande.',
          },
          { role: 'user', content: `Ämne: ${subject || '(inget)'}\n\nSvar:\n${body.slice(0, 4000)}` },
        ],
      }),
    })
    if (!res.ok) {
      console.error(`[router] AI classify failed [${res.status}]: ${(await res.text()).slice(0, 300)}`)
      return rules
    }
    const json = (await res.json()) as any
    const content = String(json?.choices?.[0]?.message?.content ?? '')
    const match = content.match(/\{[\s\S]*\}/)
    if (!match) return rules
    const parsed = JSON.parse(match[0]) as { category?: string; confidence?: number; reason?: string }
    const category = AI_CATEGORIES.includes(parsed.category as ReplyCategory)
      ? (parsed.category as ReplyCategory)
      : 'unclear'
    const confidence = Math.max(0, Math.min(1, Number(parsed.confidence) || 0))

    const routing: Routing =
      category === 'design_changes'
        ? (confidence >= LOW_CONFIDENCE && !rules.extracted.directives.unparsed ? 'auto_revision' : 'needs_review')
        : category.startsWith('question') && category !== 'question_payment' && confidence >= LOW_CONFIDENCE
          ? 'auto_answer'
          : 'needs_review'

    return {
      ...rules,
      category,
      intent: category === 'design_changes' ? 'changes' : 'unclear',
      confidence,
      reason: String(parsed.reason || rules.reason).slice(0, 300),
      classifier: 'rules+ai',
      routing,
    }
  } catch (e) {
    console.error('[router] AI classify error', e)
    return rules
  }
}
