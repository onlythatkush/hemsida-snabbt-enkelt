/**
 * Inbound replies use a dedicated subdomain so MX records for the main
 * dinwebbpartner.com domain (normal business mail) are never touched.
 */
export const REPLY_DOMAIN = (process.env.INBOUND_REPLY_DOMAIN || 'reply.dinwebbpartner.com')
  .trim()
  .toLowerCase()

/** reply+ORD-XXXXXX@reply.dinwebbpartner.com */
export function replyAddressFor(reference: string, domain = REPLY_DOMAIN) {
  return `reply+${reference.trim().toUpperCase()}@${domain}`
}
