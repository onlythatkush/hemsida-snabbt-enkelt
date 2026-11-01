/**
 * Keep customer replies on the dedicated subdomain without changing DNS.
 * Receiving still requires verified provider configuration; never assume it.
 */
export const REPLY_DOMAIN = (process.env.INBOUND_REPLY_DOMAIN || 'reply.dinwebbpartner.com')
  .trim()
  .toLowerCase()

/** reply+ORD-XXXXXX@reply.dinwebbpartner.com */
export function replyAddressFor(reference: string, domain = REPLY_DOMAIN) {
  return `reply+${reference.trim().toUpperCase()}@${domain}`
}
