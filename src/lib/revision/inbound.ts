import type { InboundEmail } from './types'

/**
 * Resend's `email.received` webhook is not guaranteed to carry the full body:
 * depending on size and configuration it can be metadata only (ids, envelope,
 * subject). In that case the body has to be fetched from the API before any
 * classification happens — classifying an empty body would silently turn a
 * real customer reply into "unclear".
 */

function asArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((v) => (typeof v === 'string' ? v : String((v as any)?.address ?? v)))
  if (typeof value === 'string' && value.trim()) return value.split(/[,;]\s*/).filter(Boolean)
  return []
}

function headerOf(headers: any, name: string): string | null {
  if (!headers) return null
  if (Array.isArray(headers)) {
    const hit = headers.find((h: any) => String(h?.name || '').toLowerCase() === name.toLowerCase())
    return hit ? String(hit.value) : null
  }
  return headers[name] ?? headers[name.toLowerCase()] ?? headers[name.toUpperCase()] ?? null
}

/** Normalises Resend / generic inbound payloads into our provider-agnostic shape. */
export function normalizeInbound(payload: any): InboundEmail & { emailId: string | null } {
  const d = payload?.data ?? payload ?? {}
  const headers = d.headers ?? {}
  return {
    emailId: d.email_id ?? d.emailId ?? d.id ?? null,
    messageId: d.message_id ?? d.messageId ?? headerOf(headers, 'Message-Id') ?? d.email_id ?? d.id ?? null,
    inReplyTo: d.in_reply_to ?? d.inReplyTo ?? headerOf(headers, 'In-Reply-To') ?? null,
    references: asArray(d.references ?? headerOf(headers, 'References')).flatMap((r) => r.split(/\s+/)).filter(Boolean),
    to: asArray(d.to),
    cc: asArray(d.cc),
    from: typeof d.from === 'string' ? d.from : (d.from?.address ?? null),
    subject: d.subject ?? null,
    text: d.text ?? null,
    html: d.html ?? null,
  }
}

export function isMetadataOnly(email: InboundEmail) {
  return !String(email.text || '').trim() && !String(email.html || '').trim()
}

export type FetchOptions = {
  apiKey?: string
  fetchImpl?: typeof fetch
}

/** Fetches the stored inbound email body from Resend. Returns null when unavailable. */
export async function fetchInboundEmail(emailId: string, opts: FetchOptions = {}): Promise<any | null> {
  const apiKey = opts.apiKey ?? process.env.RESEND_API_KEY
  if (!apiKey || !emailId) return null
  const doFetch = opts.fetchImpl ?? fetch
  const endpoints = [
    `https://api.resend.com/emails/inbound/${encodeURIComponent(emailId)}`,
    `https://api.resend.com/emails/${encodeURIComponent(emailId)}`,
  ]
  for (const url of endpoints) {
    try {
      const res = await doFetch(url, { headers: { Authorization: `Bearer ${apiKey}` } })
      if (!res.ok) continue
      const body = await res.json()
      if (body) return body
    } catch (e) {
      console.error('[inbound] fetch failed', url, e)
    }
  }
  return null
}

/**
 * Returns a fully populated inbound email, fetching the body when the webhook
 * only carried metadata. `fetched` reports whether the API had to be used.
 */
export async function resolveInboundEmail(
  payload: any,
  opts: FetchOptions = {},
): Promise<{ email: InboundEmail & { emailId: string | null }; fetched: boolean; bodyMissing: boolean }> {
  const email = normalizeInbound(payload)
  if (!isMetadataOnly(email)) return { email, fetched: false, bodyMissing: false }
  if (!email.emailId) return { email, fetched: false, bodyMissing: true }

  const full = await fetchInboundEmail(email.emailId, opts)
  if (!full) return { email, fetched: false, bodyMissing: true }

  const merged = normalizeInbound(full)
  const combined = {
    ...email,
    text: merged.text ?? email.text,
    html: merged.html ?? email.html,
    subject: email.subject ?? merged.subject,
    to: email.to?.length ? email.to : merged.to,
    cc: email.cc?.length ? email.cc : merged.cc,
    from: email.from ?? merged.from,
    inReplyTo: email.inReplyTo ?? merged.inReplyTo,
    references: email.references?.length ? email.references : merged.references,
    messageId: email.messageId ?? merged.messageId,
  }
  return { email: combined, fetched: true, bodyMissing: isMetadataOnly(combined) }
}
