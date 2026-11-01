/** Orders, confirmation and admin use the currently deployed app by default. */
export function resolvePublicApiBase(configured?: string): string {
  return configured?.trim().replace(/\/$/, "") || "";
}

export function getPublicApiBase(): string {
  const configured = import.meta.env.VITE_PUBLIC_API_BASE as string | undefined;
  return resolvePublicApiBase(configured);
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
