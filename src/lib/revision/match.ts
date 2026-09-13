import type { InboundEmail } from "./types";

/**
 * Deterministic inbound matching. A reply is only ever attached to an
 * application through an explicit, verifiable signal — never fuzzy guessing
 * on sender address or company name.
 */

export const REFERENCE_RE = /\b(ORD-[A-Z0-9]{4,12}|TEST-\d{3})\b/;

export type MatchResult = { reference: string; via: "plus-address" | "subject" | "thread" } | null;

function normalizeAddresses(list?: (string | null)[] | null) {
  return (list || [])
    .filter(Boolean)
    .map((a) => String(a).toLowerCase())
    .map((a) => {
      const angle = a.match(/<([^>]+)>/);
      return (angle?.[1] || a).trim();
    });
}

function normalizeMessageId(id?: string | null) {
  return (id || "").trim().replace(/^<|>$/g, "").toLowerCase();
}

/**
 * @param threadLookup maps a previously sent message id to its reference.
 */
export function matchInboundReference(
  email: InboundEmail,
  threadLookup: Record<string, string> = {},
): MatchResult {
  // 1. Plus-addressed reply target: reply+ORD-XXXXXX@domain
  for (const address of normalizeAddresses([...(email.to || []), ...(email.cc || [])])) {
    const local = address.split("@")[0] || "";
    const plus = local.split("+")[1];
    if (!plus) continue;
    const found = plus.toUpperCase().match(REFERENCE_RE);
    if (found?.[1]) return { reference: found[1], via: "plus-address" };
  }

  // 2. Reference token carried in the subject line of our own email.
  const subject = (email.subject || "").toUpperCase();
  const inSubject = subject.match(REFERENCE_RE);
  if (inSubject?.[1]) return { reference: inSubject[1], via: "subject" };

  // 3. Thread headers resolved against message ids we actually sent.
  const candidates = [email.inReplyTo, ...(email.references || [])]
    .map(normalizeMessageId)
    .filter(Boolean);
  const normalizedLookup: Record<string, string> = {};
  for (const [key, value] of Object.entries(threadLookup)) {
    normalizedLookup[normalizeMessageId(key)] = value;
  }
  for (const candidate of candidates) {
    const reference = normalizedLookup[candidate];
    if (reference) return { reference: reference.toUpperCase(), via: "thread" };
  }

  return null;
}
