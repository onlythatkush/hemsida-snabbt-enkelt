/**
 * Svix-style webhook signature verification (used by Resend inbound webhooks).
 * Runs on Web Crypto only, so it works in the edge runtime.
 */

const TOLERANCE_SECONDS = 5 * 60;

export type SignatureHeaders = {
  id?: string | null;
  timestamp?: string | null;
  signature?: string | null;
};

export type VerifyResult = { ok: true } | { ok: false; reason: string };

function base64ToBytes(value: string) {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function bytesToBase64(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function timingSafeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function verifyWebhookSignature(
  secret: string | undefined,
  headers: SignatureHeaders,
  rawBody: string,
  now = Date.now(),
): Promise<VerifyResult> {
  if (!secret) return { ok: false, reason: "missing_secret" };
  const { id, timestamp, signature } = headers;
  if (!id || !timestamp || !signature) return { ok: false, reason: "missing_headers" };

  const ts = Number(timestamp);
  if (!Number.isFinite(ts)) return { ok: false, reason: "bad_timestamp" };
  if (Math.abs(now / 1000 - ts) > TOLERANCE_SECONDS) return { ok: false, reason: "timestamp_out_of_tolerance" };

  const keyMaterial = secret.startsWith("whsec_")
    ? base64ToBytes(secret.slice(6))
    : new TextEncoder().encode(secret);

  const key = await crypto.subtle.importKey(
    "raw",
    keyMaterial as unknown as ArrayBuffer,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signed = `${id}.${timestamp}.${rawBody}`;
  const mac = new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(signed)));
  const expected = bytesToBase64(mac);

  const provided = signature
    .split(" ")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => (part.includes(",") ? part.split(",")[1] || "" : part));

  for (const candidate of provided) {
    if (timingSafeEqual(candidate, expected)) return { ok: true };
  }
  return { ok: false, reason: "signature_mismatch" };
}
