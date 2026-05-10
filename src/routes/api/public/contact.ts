import * as React from 'react'
import { render } from '@react-email/components'
import { createClient } from '@supabase/supabase-js'
import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { TEMPLATES } from '@/lib/email-templates/registry'

const SITE_NAME = 'Din Webbpartner'
const SENDER_DOMAIN = 'notify.dinwebbpartner.com'
const FROM_DOMAIN = 'dinwebbpartner.com'
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

async function enqueue(
  supabase: any,
  templateName: string,
  to: string,
  data: Record<string, any>,
  idempotencyKey: string,
) {
  const entry = TEMPLATES[templateName]
  if (!entry) throw new Error(`Unknown template: ${templateName}`)
  const messageId = crypto.randomUUID()
  const element = React.createElement(entry.component, data)
  const html = await render(element)
  const text = await render(element, { plainText: true })
  const subject = typeof entry.subject === 'function' ? entry.subject(data) : entry.subject

  await supabase.from('email_send_log').insert({
    message_id: messageId,
    template_name: templateName,
    recipient_email: to,
    status: 'pending',
  })

  const { error } = await supabase.rpc('enqueue_email', {
    queue_name: 'transactional_emails',
    payload: {
      message_id: messageId,
      to,
      from: `${SITE_NAME} <noreply@${FROM_DOMAIN}>`,
      sender_domain: SENDER_DOMAIN,
      subject,
      html,
      text,
      purpose: 'transactional',
      label: templateName,
      idempotency_key: idempotencyKey,
      queued_at: new Date().toISOString(),
    },
  })
  if (error) throw error
}

export const Route = createFileRoute('/api/public/contact')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
        if (!supabaseUrl || !serviceKey) {
          return Response.json({ error: 'Server misconfigured' }, { status: 500 })
        }

        let parsed
        try {
          parsed = schema.parse(await request.json())
        } catch (e) {
          return Response.json({ error: 'Invalid input' }, { status: 400 })
        }

        const supabase = createClient<any>(supabaseUrl, serviceKey)
        const id = crypto.randomUUID()

        try {
          // Notification to admin
          await enqueue(supabase, 'contact-notification', ADMIN_EMAIL, {
            name: parsed.name,
            email: parsed.email,
            phone: parsed.phone,
            company: parsed.company,
            message: parsed.message,
            source: parsed.source || 'Kontaktformulär',
            extra: parsed.extra,
          }, `contact-notify-${id}`)

          // Confirmation to customer
          await enqueue(supabase, 'contact-confirmation', parsed.email, {
            name: parsed.name,
            message: parsed.message,
          }, `contact-confirm-${id}`)
        } catch (err) {
          console.error('Failed to enqueue contact emails', err)
          return Response.json({ error: 'Failed to send' }, { status: 500 })
        }

        return Response.json({ success: true })
      },
    },
  },
})
