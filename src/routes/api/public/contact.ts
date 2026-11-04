import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { preflight, withCors } from '@/lib/cors'
import { withHub } from '@/lib/hub/db'
import { sendHubEmail, type SendResult } from '@/lib/hub/mail'
import { referenceFromSource } from '@/lib/hub/contact-ref'

const ADMIN_EMAIL = 'dinwebbpartner@hotmail.com'

const schema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().max(60).optional().or(z.literal('')),
  company: z.string().trim().max(200).optional().or(z.literal('')),
  message: z.string().trim().max(4000).optional().or(z.literal('')),
  source: z.string().trim().max(80).optional(),
  extra: z.record(z.string(), z.string().max(2000)).optional(),
})

export const Route = createFileRoute('/api/public/contact')({
  server: {
    handlers: {
      OPTIONS: async ({ request }) => preflight(request),
      POST: async ({ request }) => withCors(request, await handlePost(request)),
    },
  },
})

/**
 * Sends the customer confirmation and the admin notification through the same
 * Resend path as every other hub email. Each send is logged in
 * preview_email_log and is idempotent per order, so a retry never double-mails.
 * (The old Lovable mail queue does not exist in the production database.)
 */
async function handlePost(request: Request): Promise<Response> {
  let parsed: z.infer<typeof schema>
  try {
    parsed = schema.parse(await request.json())
  } catch {
    return Response.json({ error: 'Invalid input' }, { status: 400 })
  }

  const id = crypto.randomUUID()
  const reference = referenceFromSource(parsed.source, id)
  let customer: SendResult = { sent: false, reason: 'not_attempted' }
  let admin: SendResult = { sent: false, reason: 'not_attempted' }

  try {
    await withHub(async (sql) => {
      customer = await sendHubEmail(sql, {
        reference,
        kind: 'contact_confirmation',
        templateKey: 'contact-confirmation',
        recipient: parsed.email,
        company: parsed.company || null,
        data: { name: parsed.name, message: parsed.message },
        idempotencyKey: `contact-confirm-${reference}`,
      })
      admin = await sendHubEmail(sql, {
        reference,
        kind: 'contact_notification',
        templateKey: 'contact-notification',
        recipient: ADMIN_EMAIL,
        company: parsed.company || null,
        replyTo: parsed.email,
        data: {
          name: parsed.name,
          email: parsed.email,
          phone: parsed.phone,
          company: parsed.company,
          message: parsed.message,
          source: parsed.source || 'Kontaktformulär',
          extra: parsed.extra,
        },
        idempotencyKey: `contact-notify-${reference}`,
      })
    })
  } catch (err) {
    console.error('Contact emails failed', (err as Error)?.message)
    return Response.json({ error: 'Failed to send' }, { status: 500 })
  }

  const ok = (r: SendResult) => r.sent || r.duplicate === true
  if (!ok(customer) && !ok(admin)) {
    console.error('Contact emails not sent', { reference, customer: customer.reason, admin: admin.reason })
    return Response.json({ error: 'Failed to send', reference }, { status: 502 })
  }
  return Response.json({ success: true, reference, customerMailSent: ok(customer), adminMailSent: ok(admin) })
}
