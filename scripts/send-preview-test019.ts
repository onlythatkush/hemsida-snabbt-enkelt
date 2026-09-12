/**
 * One-off: send the TEST-019 preview email to a safe admin recipient.
 * Usage: bun scripts/send-preview-test019.ts <recipient>
 */
import * as React from 'react'
import { render } from '@react-email/components'
import { createClient } from '@supabase/supabase-js'
import { TEMPLATES } from '../src/lib/email-templates/registry'
import { getUnsubscribeToken } from '../src/lib/unsubscribe-token.server'

const recipient = process.argv[2]
if (!recipient) throw new Error('recipient required')
if (/exempel\.se|example\.(com|se|org)|test\.se/i.test(recipient)) throw new Error('unsafe recipient')

const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL!
const key = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient<any>(url, key, { auth: { persistSession: false, autoRefreshToken: false } })

const { data: app, error } = await supabase
  .from('project_applications')
  .select('reference, company, name, email, preview_url')
  .eq('reference', 'TEST-019')
  .maybeSingle()
if (error || !app?.preview_url) throw new Error('no application / preview_url')

const entry = TEMPLATES['preview-ready']
const data = {
  name: 'Kushtrim',
  company: String(app.company).replace('[TEST] ', ''),
  previewUrl: app.preview_url,
  reference: app.reference,
}
const element = React.createElement(entry.component, data)
const html = await render(element)
const text = await render(element, { plainText: true })
const subject = typeof entry.subject === 'function' ? entry.subject(data) : entry.subject
const messageId = crypto.randomUUID()

await supabase.from('email_send_log').insert({
  message_id: messageId,
  template_name: 'preview-ready',
  recipient_email: recipient,
  status: 'pending',
})

const unsubscribeToken = await getUnsubscribeToken(supabase, recipient)

const { error: rpcError } = await supabase.rpc('enqueue_email', {
  queue_name: 'transactional_emails',
  payload: {
    message_id: messageId,
    to: recipient,
    from: 'Din Webbpartner <noreply@dinwebbpartner.com>',
    sender_domain: 'notify.dinwebbpartner.com',
    subject,
    html,
    text,
    purpose: 'transactional',
    label: 'preview-ready',
    idempotency_key: `preview-ready-TEST-019-${messageId}`,
    unsubscribe_token: unsubscribeToken,
    queued_at: new Date().toISOString(),
  },
})
if (rpcError) throw rpcError

console.log(JSON.stringify({ ok: true, messageId, company: data.company, previewUrl: data.previewUrl }, null, 2))
