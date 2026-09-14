/**
 * Inbound replies use the verified main domain by default.
 *
 * Resend has receiving enabled for dinwebbpartner.com and the domain is
 * already verified in production. Using the pending reply subdomain caused
 * customer replies to disappear before the email.received webhook could fire.
 *
 * INBOUND_REPLY_DOMAIN can still override this later if a dedicated reply
 * subdomain is fully verified.
 */
export const REPLY_DOMAIN = (process.env.INBOUND_REPLY_DOMAIN || 'dinwebbpartner.com')
  .trim()
  .toLowerCase()

/** reply+ORD-XXXXXX@dinwebbpartner.com */
export function replyAddressFor(reference: string, domain = REPLY_DOMAIN) {
  return `reply+${reference.trim().toUpperCase()}@${domain}`
}
