/**
 * Route customer replies through the verified receiving domain used by the original workflow.
 * Receiving still requires verified provider configuration; never assume it.
 */
export const REPLY_DOMAIN = (process.env.INBOUND_REPLY_DOMAIN || 'dinwebbpartner.com')
  .trim()
  .toLowerCase()

/** reply+ORD-XXXXXX@dinwebbpartner.com */
export function replyAddressFor(reference: string, domain = REPLY_DOMAIN) {
  return `reply+${reference.trim().toUpperCase()}@${domain}`
}
