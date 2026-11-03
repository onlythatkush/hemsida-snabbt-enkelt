/** Customer replies use the verified receiving domain. */
export const REPLY_DOMAIN = (process.env.INBOUND_REPLY_DOMAIN || 'dinwebbpartner.com')
  .trim()
  .toLowerCase()

/** Deterministic order-specific recipient, e.g. reply+ORD-ABC123@dinwebbpartner.com. */
export function replyAddressFor(reference: string, domain = REPLY_DOMAIN): string {
  const ref = reference.trim().toUpperCase()
  if (!/^(ORD-[A-Z0-9]{4,12}|TEST-\d{3})$/.test(ref)) {
    throw new Error('Invalid order reference')
  }
  return `reply+${ref}@${domain}`
}
