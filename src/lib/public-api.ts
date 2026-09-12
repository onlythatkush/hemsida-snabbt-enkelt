/**
 * The public custom domain (dinwebbpartner.com) is served by Lovable hosting,
 * while the working backend API routes live on the Vercel deployment.
 * All public form submissions must therefore target the backend explicitly.
 */
const VERCEL_API_BASE = "https://hemsida-snabbt-enkelt.vercel.app";

const SAME_ORIGIN_HOSTS = new Set(["localhost", "127.0.0.1"]);

export function getPublicApiBase(): string {
  const configured = import.meta.env.VITE_PUBLIC_API_BASE as string | undefined;
  if (configured) return configured.replace(/\/$/, "");
  if (typeof window === "undefined") return "";
  const host = window.location.hostname;
  if (SAME_ORIGIN_HOSTS.has(host)) return "";
  if (host.endsWith("vercel.app")) return "";
  return VERCEL_API_BASE;
}

export function publicApiUrl(path: string): string {
  const base = getPublicApiBase();
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

const DEFAULT_TIMEOUT_MS = 20000;

/** fetch against the public API with an explicit base URL and a timeout. */
export async function publicApiFetch(
  path: string,
  init: RequestInit & { timeoutMs?: number } = {},
): Promise<Response> {
  const { timeoutMs = DEFAULT_TIMEOUT_MS, ...rest } = init;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(publicApiUrl(path), { ...rest, signal: controller.signal });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("Servern svarade inte i tid. Kontrollera din uppkoppling och försök igen.");
    }
    throw new Error("Kunde inte nå servern. Kontrollera din uppkoppling och försök igen.");
  } finally {
    clearTimeout(timer);
  }
}
