import * as React from 'react'
import { render } from '@react-email/components'
import { TEMPLATES } from '@/lib/email-templates/registry'
import { replyAddressFor } from '@/lib/email/reply-address'
import { logEvent, type HubSql } from './db'

const SITE_NAME = 'Din Webbpartner'
const FROM_DOMAIN = 'dinwebbpartner.com'
const BLOCKED_RECIPIENT_DOMAINS = ['exempel.se', 'example.com', 'example.se', 'example.org', 'test.se']

export type MailKind =
  | 'preview_ready'
  | 'change_received'
  | 'approval_confirmed'
  | 'question_ack'
  | 'question_answer'

/** Never falls back to the unverified resend.dev sender — it 403s for customers. */
export function hubSender() {
  const configured = (process.env.RESEND_FROM || '').trim()
  return configured && !/resend\.dev/i.test(configured)
    ? configured
    : `${SITE_NAME} <preview@${FROM_DOMAIN}>`
}

export type SendResult = {
  sent: boolean
  duplicate?: boolean
  reason?: string
  messageId?: string | null
  logId?: string | null
}

export async function renderTemplate(templateKey: string, data: Record<string, any>) {
  const entry = TEMPLATES[templateKey]
  if (!entry) throw new Error(`Okänd mall: ${templateKey}`)
  const element = React.createElement(entry.component, data)
  return {
    html: await render(element),
    text: await render(element, { plainText: true }),
    subject: typeof entry.subject === 'function' ? entry.subject(data) : entry.subject,
  }
}

/**
 * Sends a hub email and records it in preview_email_log.
 *
 * Idempotency: the log row is inserted first with a unique key. A second call
 * with the same key never reaches the provider, so a redelivered webhook or a
 * manual retry can never double-mail a customer.
 */
export async function sendHubEmail(
  sql: HubSql,
  input: {
    reference: string
    kind: MailKind
    templateKey: string
    data: Record<string, any>
    recipient: string | null | undefined
    company?: string | null
    previewUrl?: string | null
    revision?: number | null
    changeRequestId?: string | null
    idempotencyKey: string
    fetchImpl?: typeof fetch
  },
): Promise<SendResult> {
  const recipient = (input.recipient || '').trim().toLowerCase()
  if (!recipient) return { sent: false, reason: 'recipient_missing' }
  const domain = recipient.split('@')[1] || ''
  if (BLOCKED_RECIPIENT_DOMAINS.includes(domain)) return { sent: false, reason: `blocked_domain_${domain}` }

  const sender = hubSender()
  const inserted = await sql<{ id: string }[]>`
    INSERT INTO public.preview_email_log
      (reference, company, recipient, preview_url, sender, provider, status, kind, revision,
       change_request_id, idempotency_key)
    VALUES (${input.reference}, ${input.company ?? null}, ${recipient}, ${input.previewUrl ?? null},
            ${sender}, 'resend', 'queued', ${input.kind}, ${input.revision ?? null},
            ${input.changeRequestId ?? null}, ${input.idempotencyKey})
    ON CONFLICT (idempotency_key) DO NOTHING
    RETURNING id
  `
  if (!inserted.length) return { sent: false, duplicate: true, reason: 'duplicate' }
  const logId = inserted[0]!.id

  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    await sql`UPDATE public.preview_email_log SET status='failed', error_message='RESEND_API_KEY saknas', updated_at=now() WHERE id=${logId}`
    return { sent: false, reason: 'RESEND_API_KEY saknas', logId }
  }

  let rendered
  try {
    rendered = await renderTemplate(input.templateKey, input.data)
  } catch (e) {
    await sql`UPDATE public.preview_email_log SET status='failed', error_message=${String((e as any)?.message || e).slice(0, 400)}, updated_at=now() WHERE id=${logId}`
    return { sent: false, reason: 'render_failed', logId }
  }

  const doFetch = input.fetchImpl ?? fetch
  try {
    const res = await doFetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        from: sender,
        to: [recipient],
        reply_to: replyAddressFor(input.reference),
        subject: rendered.subject,
        html: rendered.html,
        text: rendered.text,
      }),
    })
    if (!res.ok) {
      const body = (await res.text()).slice(0, 400)
      await sql`UPDATE public.preview_email_log SET status='failed', error_message=${`Resend ${res.status}: ${body}`.slice(0, 500)}, updated_at=now() WHERE id=${logId}`
      await logEvent(sql, input.reference, 'mail_failed', `Mailet kunde inte skickas (${input.kind})`, {
        kind: input.kind, status: res.status,
      })
      return { sent: false, reason: `resend_${res.status}`, logId }
    }
    const out = (await res.json()) as { id?: string }
    await sql`
      UPDATE public.preview_email_log
      SET status='sent', provider_message_id=${out.id ?? null}, sent_at=now(), updated_at=now()
      WHERE id=${logId}
    `
    await logEvent(sql, input.reference, 'mail_sent', mailLabel(input.kind, input.revision), {
      kind: input.kind, messageId: out.id ?? null, revision: input.revision ?? null,
    })
    return { sent: true, messageId: out.id ?? null, logId }
  } catch (e) {
    await sql`UPDATE public.preview_email_log SET status='failed', error_message=${String((e as any)?.message || e).slice(0, 400)}, updated_at=now() WHERE id=${logId}`
    return { sent: false, reason: 'request_failed', logId }
  }
}

function mailLabel(kind: MailKind, revision?: number | null) {
  switch (kind) {
    case 'preview_ready': return revision ? `Previewmail skickat (version ${revision})` : 'Previewmail skickat'
    case 'change_received': return 'Kvittens på ändringar skickad'
    case 'approval_confirmed': return 'Bekräftelse på godkännande skickad'
    case 'question_ack': return 'Kvittens på fråga skickad'
    case 'question_answer': return 'Automatsvar på fråga skickat'
    default: return 'Mail skickat'
  }
}
